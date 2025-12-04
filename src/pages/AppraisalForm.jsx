import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, Upload, File, X, Download, Eye } from 'lucide-react';
import { APPRAISAL_TEMPLATE } from '../data/mockData';
import { validateAppraisal } from '../utils/validation';
import { calculateAppraisalScores } from '../utils/scoring';

const RatingOptions = ({ value, onChange, disabled }) => {
    const options = [
        { label: 'EP', full: 'Exceptional Performance', value: 'EP' },
        { label: 'SP', full: 'Strong Performance', value: 'SP' },
        { label: 'AP', full: 'Average Performance', value: 'AP' },
        { label: 'NIP', full: 'Needs Improvement', value: 'NIP' },
        { label: 'WP', full: 'Weak Performance', value: 'WP' },
    ];

    return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`btn ${value === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                    title={opt.full}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

const AppraisalForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { appraisals, createAppraisal, getAppraisal, updateAppraisal, users, periods } = useData();
    const notify = useNotification();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [appraisal, setAppraisal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [attachmentError, setAttachmentError] = useState(null);
    const fileInputRef = useRef(null);
    const isCreatingRef = useRef(false);

    useEffect(() => {
        const initAppraisal = async () => {
            try {
                setLoading(true);
                setError(null);

                if (id === 'new' && user.role === 'staff') {
                    if (isCreatingRef.current) return;
                    if (!periods || periods.length === 0) {
                        setError('Loading periods...');
                        return;
                    }
                    const activePeriod = periods.find(p => p.isActive === true);
                    if (!activePeriod) {
                        notify.error('No active appraisal period.');
                        navigate('/appraisals');
                        return;
                    }
                    isCreatingRef.current = true;
                    const result = await createAppraisal(user.id, null, activePeriod.id);
                    if (result.success) {
                        notify.success('New appraisal created');
                        navigate(`/appraisals/${result.data.id}`, { replace: true });
                    } else {
                        notify.error(result.error || 'Failed to create appraisal');
                        isCreatingRef.current = false;
                        navigate('/appraisals');
                    }
                } else if (id !== 'new') {
                    const result = await getAppraisal(id);
                    if (result.success) {
                        const found = result.data;
                        setAppraisal(found);
                        const hasContent = found.content && found.content.sectionA;
                        setFormData(hasContent ? found.content : APPRAISAL_TEMPLATE);
                        if (found.attachment) {
                            setAttachment(found.attachment);
                        }
                        setLoading(false);
                    } else {
                        setError('Appraisal not found or unauthorized');
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error initializing appraisal:', err);
                setError(err.message);
                isCreatingRef.current = false;
                setLoading(false);
            }
        };
        initAppraisal();
    }, [id, user.role, periods]);

    const canEdit = () => {
        if (!appraisal) return false;
        if (user.role === 'staff' && appraisal.status === 'draft') return true;
        if (user.role === 'supervisor' && appraisal.status === 'submitted') return true;
        if (user.role === 'hr' && appraisal.status === 'supervisor_approved') return true;
        if (user.role === 'md' && appraisal.status === 'hr_approved') return true;
        return false;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        setAttachmentError(null);
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setAttachmentError('Only PDF files are allowed');
            e.target.value = '';
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setAttachmentError('File size must not exceed 5MB');
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setAttachment({
                fileName: file.name,
                fileSize: file.size,
                fileData: reader.result
            });
            notify.success('File attached successfully');
        };
        reader.onerror = () => {
            setAttachmentError('Failed to read file');
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatFileSize = (bytes) => {
        if (!bytes || isNaN(bytes) || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleViewAttachment = () => {
        if (!attachment || !attachment.fileData) {
            notify.error("Attachment data is missing");
            return;
        }
        try {
            const base64Data = attachment.fileData.includes(',') ? attachment.fileData.split(',')[1] : attachment.fileData;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(blob);
            const newWindow = window.open(fileURL, '_blank');
            if (!newWindow) notify.error("Please allow popups to view the PDF");
        } catch (e) {
            console.error("Error viewing PDF:", e);
            notify.error("Could not open PDF: " + e.message);
        }
    };

    const handleDownloadAttachment = () => {
        if (!attachment || !attachment.fileData) {
            notify.error("Attachment data is missing");
            return;
        }
        try {
            const link = document.createElement('a');
            link.href = attachment.fileData;
            link.download = attachment.fileName || 'appraisal_attachment.pdf';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify.success("Download started");
        } catch (e) {
            console.error("Error downloading PDF:", e);
            notify.error("Could not download PDF: " + e.message);
        }
    };

    const handleSave = async () => {
        if (!appraisal) return;
        const result = await updateAppraisal(appraisal.id, { content: formData, attachment });
        if (result.success) notify.success('Draft saved successfully!');
        else notify.error(result.error || 'Failed to save draft');
    };

    const handleSubmit = async () => {
        if (!appraisal) return;
        const validation = validateAppraisal(formData, user.role);
        if (!validation.isValid) {
            const errorMessages = Object.values(validation.errors);
            notify.error(`Please complete all required fields: ${errorMessages.join(', ')}`);
            return;
        }

        let newStatus = appraisal.status;
        let action = '';
        let scores = null;

        if (user.role === 'staff' && appraisal.status === 'draft') {
            newStatus = 'submitted';
            action = 'Submitted for supervisor review';
        } else if (user.role === 'supervisor' && appraisal.status === 'submitted') {
            newStatus = 'supervisor_approved';
            action = 'Approved by Supervisor';
        } else if (user.role === 'hr' && appraisal.status === 'supervisor_approved') {
            newStatus = 'hr_approved';
            action = 'Approved by HR';
        } else if (user.role === 'md' && appraisal.status === 'hr_approved') {
            newStatus = 'md_approved';
            action = 'Final approval by MD/CEO';
            const calculatedScores = calculateAppraisalScores(formData);
            scores = {
                employeeScore: calculatedScores.employeeScore,
                supervisorScore: calculatedScores.supervisorScore,
                totalScore: calculatedScores.finalScore,
                rating: calculatedScores.grade,
                ratingLabel: calculatedScores.gradeLabel
            };
        }

        const updateData = { content: formData, status: newStatus, attachment };
        if (scores) updateData.scores = scores;

        const result = await updateAppraisal(appraisal.id, updateData);
        if (result.success) {
            notify.success(`Appraisal ${action.toLowerCase()}`);
            navigate('/appraisals');
        } else {
            notify.error(result.error || 'Failed to update appraisal');
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading appraisal...</div>;
    if (error) return <div style={{ color: 'red', padding: '2rem' }}>Error: {error}</div>;
    if (!formData || !appraisal) return <div style={{ color: 'white', padding: '2rem' }}>Initializing...</div>;

    const staffName = appraisal.staff?.name || 'Unknown';
    const staffDesignation = appraisal.staff?.designation || 'Unknown';
    const supervisorName = appraisal.supervisor?.name || 'Not Assigned';
    const periodName = appraisal.periodLabel || appraisal.Period?.label || 'Unknown Period';
    const isEditable = canEdit();

    return (
        <div className="animate-fade-in">
            <div className="header">
                <button onClick={() => navigate('/appraisals')} className="btn btn-secondary" style={{ marginRight: '1rem' }}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Appraisal Form</h1>
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                    AGRO PRECISO LTD: STAFF APPRAISAL FORM
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div><label className="label">Staff Name</label><input className="input" value={staffName} disabled /></div>
                    <div><label className="label">Designation</label><input className="input" value={staffDesignation} disabled /></div>
                    <div><label className="label">Supervisor</label><input className="input" value={supervisorName} disabled /></div>
                    <div><label className="label">Appraisal Period</label><input className="input" value={periodName} disabled /></div>
                    <div><label className="label">Date of Review</label><input className="input" value={appraisal.createdAt} disabled /></div>
                    <div><label className="label">Status</label><input className="input" value={appraisal.status.replace('_', ' ').toUpperCase()} disabled /></div>
                </div>
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>Yearly Report</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Upload a PDF document to support your appraisal (max 5MB)</p>
                {isEditable && user.role === 'staff' ? (
                    <div>
                        <div style={{ border: '2px dashed var(--color-border)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', marginBottom: '1rem' }}>
                            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} id="pdf-upload" />
                            <label htmlFor="pdf-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={48} style={{ color: 'var(--color-primary)' }} />
                                <span style={{ color: 'white', fontWeight: '600' }}>Click to upload PDF</span>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>PDF files only, up to 5MB</span>
                            </label>
                        </div>
                        {attachmentError && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{attachmentError}</div>}
                        {attachment && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <File size={24} style={{ color: 'var(--color-primary)' }} />
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>{attachment.fileName || 'Attachment.pdf'}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{attachment.fileSize ? formatFileSize(attachment.fileSize) : 'Size unknown'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={handleViewAttachment} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Eye size={20} /></button>
                                    <button type="button" onClick={handleRemoveAttachment} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : attachment ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <File size={24} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>{attachment.fileName || 'Attachment.pdf'}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{attachment.fileSize ? formatFileSize(attachment.fileSize) : 'Size unknown'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" onClick={handleViewAttachment} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Eye size={20} /></button>
                            <button type="button" onClick={handleDownloadAttachment} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Download size={20} /></button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No attachment uploaded</div>
                )}
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>SECTION A: GOALS, ACTION PLANS AND ACHIEVEMENT</h3>
                {!formData?.sectionA?.objectives ? (
                    <div style={{ padding: '1rem', color: 'orange' }}>
                        Warning: Section A data is missing.
                        <button className="btn btn-primary" onClick={() => setFormData(APPRAISAL_TEMPLATE)} style={{ marginLeft: '1rem' }}>Reset Form Data</button>
                    </div>
                ) : (
                    formData.sectionA.objectives.map((obj, idx) => (
                        <div key={obj.id || idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Objective {idx + 1}</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={obj.objective || ''}
                                        disabled={!isEditable || user.role !== 'staff'}
                                        onChange={(e) => {
                                            const newObjs = [...formData.sectionA.objectives];
                                            newObjs[idx].objective = e.target.value;
                                            setFormData({ ...formData, sectionA: { ...formData.sectionA, objectives: newObjs } });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Action Plan</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={obj.actionPlan || ''}
                                        disabled={!isEditable || user.role !== 'staff'}
                                        onChange={(e) => {
                                            const newObjs = [...formData.sectionA.objectives];
                                            newObjs[idx].actionPlan = e.target.value;
                                            setFormData({ ...formData, sectionA: { ...formData.sectionA, objectives: newObjs } });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Employee Comment</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={obj.employeeComment || ''}
                                        disabled={!isEditable || user.role !== 'staff'}
                                        onChange={(e) => {
                                            const newObjs = [...formData.sectionA.objectives];
                                            newObjs[idx].employeeComment = e.target.value;
                                            setFormData({ ...formData, sectionA: { ...formData.sectionA, objectives: newObjs } });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Supervisor Comment</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={obj.supervisorComment || ''}
                                        disabled={!isEditable || user.role !== 'supervisor'}
                                        onChange={(e) => {
                                            const newObjs = [...formData.sectionA.objectives];
                                            newObjs[idx].supervisorComment = e.target.value;
                                            setFormData({ ...formData, sectionA: { ...formData.sectionA, objectives: newObjs } });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}

                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Employee Self-Assessment</h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries({
                        achievements: 'Key Achievements',
                        challenges: 'Challenges Faced',
                        strengths: 'Strengths',
                        improvements: 'Areas for Improvement',
                        goals: 'Career Goals'
                    }).map(([key, label]) => (
                        <div key={key}>
                            <label className="label">{label}</label>
                            <textarea
                                className="input"
                                rows="4"
                                value={formData?.sectionA?.selfAssessment?.[key] || ''}
                                disabled={!isEditable || user.role !== 'staff'}
                                onChange={(e) => {
                                    if (!formData.sectionA) return;
                                    setFormData({
                                        ...formData,
                                        sectionA: {
                                            ...formData.sectionA,
                                            selfAssessment: {
                                                ...formData.sectionA.selfAssessment,
                                                [key]: e.target.value
                                            }
                                        }
                                    });
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>SECTION B: GENERAL PERFORMANCE - SKILLS AND BEHAVIOUR</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', width: '40%' }}>Skills and Behaviour</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Employee Rating</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Supervisor Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData?.sectionB?.map((skill, idx) => (
                                <tr key={skill.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{skill.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{skill.description}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <RatingOptions
                                            value={skill.employeeRating}
                                            disabled={!isEditable || user.role !== 'staff'}
                                            onChange={(val) => {
                                                const newSkills = [...formData.sectionB];
                                                newSkills[idx].employeeRating = val;
                                                setFormData({ ...formData, sectionB: newSkills });
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <RatingOptions
                                            value={skill.supervisorRating}
                                            disabled={!isEditable || user.role !== 'supervisor'}
                                            onChange={(val) => {
                                                const newSkills = [...formData.sectionB];
                                                newSkills[idx].supervisorRating = val;
                                                setFormData({ ...formData, sectionB: newSkills });
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>RECOMMENDATIONS FROM REVIEWER</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label className="label">Learning and Development Needs</label>
                        <textarea
                            className="input"
                            rows="4"
                            value={formData?.recommendations?.learningNeeds || ''}
                            disabled={!isEditable || user.role === 'staff'}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    recommendations: { ...formData.recommendations, learningNeeds: e.target.value }
                                });
                            }}
                        />
                    </div>
                    <div>
                        <label className="label">Other Areas of Improvement</label>
                        <textarea
                            className="input"
                            rows="4"
                            value={formData?.recommendations?.otherImprovements || ''}
                            disabled={!isEditable || user.role === 'staff'}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    recommendations: { ...formData.recommendations, otherImprovements: e.target.value }
                                });
                            }}
                        />
                    </div>
                </div>
            </div>

            {isEditable && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} className="btn btn-secondary"><Save size={20} /> Save Draft</button>
                    <button onClick={handleSubmit} className="btn btn-primary"><Send size={20} /> {user.role === 'staff' ? 'Submit' : 'Approve'}</button>
                </div>
            )}

            <div className="card glass-panel" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>Activity Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {appraisal.logs && appraisal.logs.map((log, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{log.action}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}> by {log.user} on {new Date(log.date).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AppraisalForm;
