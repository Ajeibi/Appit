import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAppraisalPDF = (appraisal, staff, supervisor) => {
    try {
        const doc = new jsPDF();

        // Verify autoTable is available
        if (typeof autoTable !== 'function') {
            console.error('jspdf-autotable plugin not loaded correctly');
            throw new Error('PDF Generator configuration error');
        }

        const pageWidth = doc.internal.pageSize.width;

        // Company Brand Colors (matching logo)
        const brandGreen = [22, 163, 74];      // #16a34a - Primary green from logo
        const brandDarkGreen = [21, 128, 61];  // #15803d - Darker green
        const brandBlack = [31, 41, 55];       // Dark grey/black from logo text
        const lightGrey = [241, 245, 249];     // Light background

        // Helper for centered text
        const centerText = (text, y) => {
            if (!text) return;
            try {
                const textWidth = doc.getStringUnitWidth(String(text)) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                const x = (pageWidth - textWidth) / 2;
                doc.text(String(text), x, y);
            } catch (e) {
                console.warn('Error centering text:', e);
                doc.text(String(text), 14, y);
            }
        };

        // Header with Company Branding
        // Green header bar
        doc.setFillColor(...brandGreen);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Company name in white
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        centerText('AGRO PRECISO LTD', 18);

        // Tagline/subtitle
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        centerText('RC: 1695344', 28);

        // Document title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        centerText('STAFF PERFORMANCE APPRAISAL REPORT', 38);

        // Reset text color to dark
        doc.setTextColor(...brandBlack);

        // Staff Details Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...brandGreen);
        doc.text('STAFF DETAILS', 14, 55);
        doc.setTextColor(...brandBlack);

        const detailsData = [
            ['Staff Name:', staff?.name || 'N/A', 'Period:', appraisal?.period || 'N/A'],
            ['Designation:', staff?.designation || 'N/A', 'Department:', staff?.department || 'N/A'],
            ['Supervisor:', supervisor?.name || 'N/A', 'Status:', (appraisal?.status || 'N/A').replace('_', ' ').toUpperCase()]
        ];

        autoTable(doc, {
            startY: 60,
            head: [],
            body: detailsData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2, textColor: brandBlack },
            columnStyles: {
                0: { fontStyle: 'bold', width: 30 },
                2: { fontStyle: 'bold', width: 30 }
            }
        });

        let currentY = (doc.lastAutoTable?.finalY || 60) + 10;

        // Scores Summary (if available)
        if (appraisal?.scores) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandGreen);
            doc.text('PERFORMANCE SCORE', 14, currentY);
            doc.setTextColor(...brandBlack);

            const scoreData = [
                ['Total Score:', `${appraisal.scores.totalScore || 0}%`],
                ['Rating:', appraisal.scores.rating || 'N/A'],
                ['Grade:', appraisal.scores.grade || 'N/A']
            ];

            autoTable(doc, {
                startY: currentY + 5,
                head: [],
                body: scoreData,
                theme: 'grid',
                headStyles: { fillColor: brandGreen, textColor: [255, 255, 255] },
                styles: { fontSize: 10, cellPadding: 3, textColor: brandBlack },
                columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY) + 10;
        }

        // Section A: Objectives
        if (appraisal?.data?.sectionA?.objectives && Array.isArray(appraisal.data.sectionA.objectives)) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandGreen);
            doc.text('SECTION A: OBJECTIVES & ACHIEVEMENTS', 14, currentY);
            doc.setTextColor(...brandBlack);

            const objectivesData = appraisal.data.sectionA.objectives.map((obj, idx) => [
                `Objective ${idx + 1}`,
                obj.objective || '-',
                obj.actionPlan || '-',
                obj.employeeComment || '-'
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['#', 'Objective', 'Action Plan', 'Achievement/Comment']],
                body: objectivesData,
                theme: 'grid',
                headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3, textColor: brandBlack },
                columnStyles: { 0: { width: 20 } }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY) + 10;
        }

        // Self Assessment
        if (appraisal?.data?.sectionA?.selfAssessment) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandGreen);
            doc.text('SELF ASSESSMENT', 14, currentY);
            doc.setTextColor(...brandBlack);

            const selfAssessment = appraisal.data.sectionA.selfAssessment;
            const saData = [
                ['Key Achievements', selfAssessment.achievements || '-'],
                ['Challenges', selfAssessment.challenges || '-'],
                ['Strengths', selfAssessment.strengths || '-'],
                ['Areas for Improvement', selfAssessment.improvements || '-']
            ];

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Category', 'Details']],
                body: saData,
                theme: 'grid',
                headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3, textColor: brandBlack },
                columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY) + 10;
        }

        // New Page for Skills
        doc.addPage();
        currentY = 20;

        // Add header to new page
        doc.setFillColor(...brandGreen);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        centerText('AGRO PRECISO LTD - Performance Appraisal Report', 10);
        doc.setTextColor(...brandBlack);
        currentY = 25;

        // Section B: Skills
        if (appraisal?.data?.sectionB && Array.isArray(appraisal.data.sectionB)) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandGreen);
            doc.text('SECTION B: SKILLS & BEHAVIOUR', 14, currentY);
            doc.setTextColor(...brandBlack);

            const skillsData = appraisal.data.sectionB.map(skill => [
                skill.name || 'Unknown Skill',
                skill.employeeRating || '-',
                skill.supervisorRating || '-'
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Skill/Competency', 'Staff Rating', 'Supervisor Rating']],
                body: skillsData,
                theme: 'grid',
                headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 2, textColor: brandBlack },
                columnStyles: {
                    0: { width: 100 },
                    1: { halign: 'center' },
                    2: { halign: 'center' }
                }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY) + 10;
        }

        // Recommendations
        if (appraisal?.data?.recommendations) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandGreen);
            doc.text('RECOMMENDATIONS', 14, currentY);
            doc.setTextColor(...brandBlack);

            const recData = [
                ['Learning Needs', appraisal.data.recommendations.learningNeeds || 'None specified'],
                ['Other Improvements', appraisal.data.recommendations.otherImprovements || 'None specified']
            ];

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Category', 'Details']],
                body: recData,
                theme: 'grid',
                headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3, textColor: brandBlack },
                columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY) + 20;
        }

        // Signatures Section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...brandBlack);

        const signatureY = currentY + 10;

        // Signature lines with green color
        doc.setDrawColor(...brandGreen);
        doc.setLineWidth(0.5);
        doc.line(14, signatureY, 70, signatureY);
        doc.text('Staff Signature', 14, signatureY + 5);

        doc.line(80, signatureY, 136, signatureY);
        doc.text('Supervisor Signature', 80, signatureY + 5);

        doc.line(146, signatureY, 200, signatureY);
        doc.text('HR/MD Signature', 146, signatureY + 5);

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');

            // Footer line
            doc.setDrawColor(...brandGreen);
            doc.setLineWidth(0.5);
            doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);

            // Footer text
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} | Agro Preciso Ltd | RC: 1695344`,
                14,
                doc.internal.pageSize.height - 10
            );
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth - 14,
                doc.internal.pageSize.height - 10,
                { align: 'right' }
            );
        }

        doc.save(`Appraisal_${staff?.name || 'Staff'}_${appraisal?.period || 'Report'}.pdf`);
    } catch (error) {
        console.error('PDF Generation failed:', error);
        throw error;
    }
};
