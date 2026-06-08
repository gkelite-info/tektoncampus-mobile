import { ResumeData } from "./Resumedatafetcher";

export function generateStandardTemplate(data: ResumeData): string {
    const { name, city, email, mobile, linkedInId, profileSummary, education, employment, projects, internships, skills } = data;

    const allSkills = skills.flatMap(group => group.skills).join(", ");

    return `
    <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; margin: 40px; }
                h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 5px; text-align: center; }
                .contact-info { text-align: center; font-size: 12px; margin-bottom: 20px; }
                .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #333; margin-top: 15px; margin-bottom: 10px; padding-bottom: 3px; }
                .item-title { font-weight: bold; font-size: 14px; }
                .item-subtitle { font-size: 13px; font-style: italic; color: #555; margin-bottom: 5px; }
                .item-desc { font-size: 12px; margin-bottom: 10px; }
                ul { margin-top: 0; padding-left: 20px; font-size: 12px;}
                .flex-between { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <h1>${name || "Your Name"}</h1>
            <div class="contact-info">
                ${city || "City"} | ${email || "Email"} | ${mobile || "Mobile"} ${linkedInId ? `| ${linkedInId}` : ''}
            </div>

            ${profileSummary ? `
            <div class="section-title">Professional Summary</div>
            <div class="item-desc">${profileSummary}</div>
            ` : ''}

            ${skills.length > 0 ? `
            <div class="section-title">Skills</div>
            <div class="item-desc"><b>Key Skills:</b> ${allSkills}</div>
            ` : ''}

            ${employment.length > 0 ? `
            <div class="section-title">Experience</div>
            ${employment.map(emp => `
                <div>
                    <div class="flex-between">
                        <div class="item-title">${emp.designation} at ${emp.companyName}</div>
                        <div class="item-subtitle">${emp.experienceYears}y ${emp.experienceMonths}m</div>
                    </div>
                </div>
            `).join('')}
            ` : ''}

            ${internships.length > 0 ? `
            <div class="section-title">Internships</div>
            ${internships.map(int => `
                <div>
                    <div class="flex-between">
                        <div class="item-title">${int.role} | ${int.organizationName}</div>
                        <div class="item-subtitle">${int.startDate ? int.startDate.split('-')[0] : ''} - ${int.endDate ? int.endDate.split('-')[0] : 'Present'}</div>
                    </div>
                    <div class="item-desc">${int.description || ''}</div>
                </div>
            `).join('')}
            ` : ''}

            ${projects.length > 0 ? `
            <div class="section-title">Projects</div>
            ${projects.map(proj => `
                <div>
                    <div class="item-title">${proj.projectName}</div>
                    <div class="item-subtitle">Tech: ${proj.toolsAndTechnologies}</div>
                    <div class="item-desc">${proj.description || ''}</div>
                </div>
            `).join('')}
            ` : ''}

            ${education.length > 0 ? `
            <div class="section-title">Education</div>
            ${education.map(ed => `
                <div>
                    <div class="flex-between">
                        <div class="item-title">${ed.educationLevel} - ${ed.courseName}</div>
                        <div class="item-subtitle">${ed.startYear} - ${ed.yearOfPassing || 'Present'}</div>
                    </div>
                    <div class="item-desc">${ed.institutionName} | CGPA: ${ed.cgpa || ed.percentage || 'N/A'}</div>
                </div>
            `).join('')}
            ` : ''}

        </body>
    </html>
    `;
}

export function generateModernTemplate(data: ResumeData): string {
    const { name, city, email, mobile, profileSummary, education, employment, projects, skills } = data;

    const allSkills = skills.flatMap(group => group.skills).join(" • ");

    return `
    <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c3e50; margin: 0; padding: 0; background: #fff;}
                .header { background-color: #34495e; color: #fff; padding: 40px; text-align: center; }
                h1 { font-size: 32px; font-weight: 300; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
                .contact { font-size: 13px; margin-top: 10px; opacity: 0.8; letter-spacing: 1px; }
                .content { padding: 40px; }
                .section-title { font-size: 18px; color: #2980b9; margin-bottom: 15px; margin-top: 25px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; }
                .item-title { font-size: 15px; font-weight: bold; color: #34495e; margin-bottom: 2px; }
                .item-subtitle { font-size: 13px; color: #7f8c8d; font-style: italic; margin-bottom: 8px; }
                .item-desc { font-size: 13px; line-height: 1.6; color: #555; }
                .skills-block { background: #ecf0f1; padding: 15px; border-radius: 4px; font-size: 13px; color: #34495e; line-height: 1.8;}
                .flex-row { display: flex; justify-content: space-between; align-items: baseline; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${name || "Your Name"}</h1>
                <div class="contact">${email || "Email"} | ${mobile || "Mobile"} | ${city || "City"}</div>
            </div>
            
            <div class="content">
                ${profileSummary ? `
                <div class="section-title">Profile Summary</div>
                <div class="item-desc">${profileSummary}</div>
                ` : ''}

                ${employment.length > 0 ? `
                <div class="section-title">Professional Experience</div>
                ${employment.map(emp => `
                    <div style="margin-bottom: 15px;">
                        <div class="flex-row">
                            <div class="item-title">${emp.designation}</div>
                            <div class="item-subtitle">${emp.experienceYears}y ${emp.experienceMonths}m</div>
                        </div>
                        <div class="item-subtitle">${emp.companyName}</div>
                    </div>
                `).join('')}
                ` : ''}

                ${projects.length > 0 ? `
                <div class="section-title">Projects</div>
                ${projects.map(proj => `
                    <div style="margin-bottom: 15px;">
                        <div class="item-title">${proj.projectName}</div>
                        <div class="item-subtitle">${proj.toolsAndTechnologies}</div>
                        <div class="item-desc">${proj.description || ''}</div>
                    </div>
                `).join('')}
                ` : ''}

                ${skills.length > 0 ? `
                <div class="section-title">Core Competencies</div>
                <div class="skills-block">${allSkills}</div>
                ` : ''}

                ${education.length > 0 ? `
                <div class="section-title">Education</div>
                ${education.map(ed => `
                    <div style="margin-bottom: 15px;">
                        <div class="flex-row">
                            <div class="item-title">${ed.educationLevel}</div>
                            <div class="item-subtitle">${ed.startYear} - ${ed.yearOfPassing || 'Present'}</div>
                        </div>
                        <div class="item-desc">${ed.institutionName} | ${ed.courseName} | CGPA: ${ed.cgpa || ed.percentage || 'N/A'}</div>
                    </div>
                `).join('')}
                ` : ''}
            </div>
        </body>
    </html>
    `;
}
