// ============================================================
// PrepMate AI - Professional AI Resume Builder
// Supports:
// - Higher Education: B.Tech / B.E. / Degree / Diploma / Masters
// - Intermediate / 12th
// - SSC / 10th / CBSE / ICSE
// - Skills
// - Projects
// - Internship / Experience
// - Certifications
// - Achievements
// - PDF / DOCX export
// - Manual Resume auto-fill
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------------------------------------
  // ELEMENTS
  // ----------------------------------------------------------

  const form = document.getElementById("aiProfileForm");

  const generateBtn =
    document.getElementById("generateAiBtn");

  const previewSection =
    document.getElementById("previewSection");

  const emptyState =
    document.getElementById("emptyState");

  const resumePreview =
    document.getElementById("aiResumeText");

  const loadingOverlay =
    document.getElementById("loadingOverlay");

  const editBtn =
    document.getElementById("editBtn");

  const downloadPdfBtn =
    document.getElementById("downloadPdfBtn");

  const downloadDocxBtn =
    document.getElementById("downloadDocxBtn");

  const autoFillBtn =
    document.getElementById("autoFillBtn");


  let generatedResumeData = null;


  if (!generateBtn) {
    console.error("Generate Resume button not found.");
    return;
  }


  // ==========================================================
  // GENERATE AI RESUME
  // ==========================================================

  generateBtn.addEventListener("click", async () => {

    if (!validateForm()) {
      return;
    }


    // --------------------------------------------------------
    // COMPLETE PROFILE DATA
    // --------------------------------------------------------

    const formData = {

      // PERSONAL INFORMATION
      personal: {

        name: value("profileName"),

        email: value("profileEmail"),

        phone: value("profilePhone"),

        location: value("profileLocation"),

        linkedin: value("profileLinkedin"),

        github: value("profileGithub")

      },


      // CAREER INFORMATION
      career: {

        targetRole:
          value("profileTitle"),

        experienceLevel:
          value("profileExperience"),

        summary:
          value("profileSummary")

      },


      // EDUCATION
      //
      // ALL THREE CAN EXIST AT THE SAME TIME
      //
      education: {

        higher: {

          degree:
            value("higherDegree"),

          branch:
            value("higherBranch"),

          college:
            value("higherCollege"),

          university:
            value("higherUniversity"),

          score:
            value("higherScore"),

          startYear:
            value("higherStart"),

          endYear:
            value("higherEnd")

        },


        intermediate: {

          course:
            value("intermediateCourse"),

          college:
            value("intermediateCollege"),

          board:
            value("intermediateBoard"),

          score:
            value("intermediateScore"),

          year:
            value("intermediateYear")

        },


        school: {

          school:
            value("schoolName"),

          board:
            value("schoolBoard"),

          score:
            value("schoolScore"),

          year:
            value("schoolYear")

        }

      },


      // TECHNICAL SKILLS
      skills:
        value("profileSkills"),


      // PROJECT
      projects: {

        name:
          value("projectName"),

        description:
          value("projectDescription"),

        technologies:
          value("projectTechnologies"),

        github:
          value("projectGithub")

      },


      // EXPERIENCE / INTERNSHIP
      experience: {

        company:
          value("experienceCompany"),

        role:
          value("experienceRole"),

        duration:
          value("experienceDuration"),

        description:
          value("experienceDescription")

      },


      // CERTIFICATIONS
      certifications:
        value("certifications"),


      // ACHIEVEMENTS
      achievements:
        value("achievements"),


      // TARGET JOB
      jobUrl:
        value("profileJobUrl")

    };


    generatedResumeData = formData;


    // SHOW LOADING
    showLoading(true);


    try {

      console.log(
        "Sending AI resume request:",
        formData
      );


      // ------------------------------------------------------
      // BACKEND REQUEST
      // ------------------------------------------------------

      const response =
        await window.apiPostJson(
          "/api/ai/resume/generate",
          formData
        );


      console.log(
        "AI Resume API response:",
        response
      );


      showLoading(false);


      if (!response || !response.ok) {

        alert(
          response?.data?.message ||
          "AI resume generation failed."
        );

        return;
      }


      // ------------------------------------------------------
      // DISPLAY RESUME
      // ------------------------------------------------------

      renderResume(
        response.data,
        formData
      );


    } catch (error) {

      showLoading(false);

      console.error(
        "AI Resume Error:",
        error
      );

      alert(
        "Error generating resume: " +
        error.message
      );

    }

  });


  // ==========================================================
  // FORM VALIDATION
  // ==========================================================

  function validateForm() {

    const requiredFields = [

      ["profileName", "Full Name"],

      ["profileEmail", "Email"],

      ["profileTitle", "Target Job Role"],

      ["profileExperience", "Experience Level"],

      ["profileSkills", "Technical Skills"]

    ];


    for (const [id, label] of requiredFields) {

      const input =
        document.getElementById(id);


      if (!input || !input.value.trim()) {

        alert(
          `Please enter ${label}.`
        );


        if (input) {
          input.focus();
        }


        return false;
      }

    }


    // --------------------------------------------------------
    // AT LEAST ONE EDUCATION ENTRY
    // --------------------------------------------------------

    const hasHigher =
      value("higherDegree") ||
      value("higherCollege");


    const hasIntermediate =
      value("intermediateCourse") ||
      value("intermediateCollege");


    const hasSchool =
      value("schoolName");


    if (
      !hasHigher &&
      !hasIntermediate &&
      !hasSchool
    ) {

      alert(
        "Please enter at least one education qualification."
      );


      document
        .getElementById("higherDegree")
        ?.focus();


      return false;
    }


    return true;
  }


  // ==========================================================
  // RENDER COMPLETE RESUME
  // ==========================================================

  function renderResume(data, profile) {

    if (emptyState) {
      emptyState.style.display = "none";
    }


    if (previewSection) {
      previewSection.style.display = "block";
    }


    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------

    const summary =
      profile.career.summary ||
      createProfessionalSummary(profile);


    // --------------------------------------------------------
    // FRESHER CHECK
    // --------------------------------------------------------

    const isFresher =
      profile.career.experienceLevel ===
      "fresher";


    // --------------------------------------------------------
    // BUILD RESUME
    // --------------------------------------------------------

    let html = `

      <div class="professional-resume">

        <!-- ============================================= -->
        <!-- HEADER -->
        <!-- ============================================= -->

        <header class="resume-header">

          <h1>
            ${esc(profile.personal.name)}
          </h1>


          <h2>
            ${esc(profile.career.targetRole)}
          </h2>


          <div class="resume-contact">

            ${
              profile.personal.email
                ? `<span>
                    ${esc(profile.personal.email)}
                   </span>`
                : ""
            }


            ${
              profile.personal.phone
                ? `<span>
                    ${esc(profile.personal.phone)}
                   </span>`
                : ""
            }


            ${
              profile.personal.location
                ? `<span>
                    ${esc(profile.personal.location)}
                   </span>`
                : ""
            }

          </div>


          <div class="resume-links">

            ${
              profile.personal.linkedin
                ? `<span>
                    LinkedIn
                   </span>`
                : ""
            }


            ${
              profile.personal.github
                ? `<span>
                    GitHub
                   </span>`
                : ""
            }

          </div>

        </header>


        <!-- ============================================= -->
        <!-- PROFESSIONAL SUMMARY -->
        <!-- ============================================= -->

        ${section(
          "PROFESSIONAL SUMMARY",
          `
            <p>
              ${esc(summary)}
            </p>
          `
        )}


        <!-- ============================================= -->
        <!-- EDUCATION -->
        <!-- ============================================= -->

        ${renderEducation(profile.education)}


        <!-- ============================================= -->
        <!-- TECHNICAL SKILLS -->
        <!-- ============================================= -->

        ${
          profile.skills
            ? section(
                "TECHNICAL SKILLS",
                `
                  <div class="skills-grid">

                    ${splitSkills(
                      profile.skills
                    )
                      .map(
                        skill =>
                          `
                          <span class="skill-item">
                            ${esc(skill)}
                          </span>
                          `
                      )
                      .join("")}

                  </div>
                `
              )
            : ""
        }


        <!-- ============================================= -->
        <!-- PROJECTS -->
        <!-- ============================================= -->

        ${
          profile.projects.name
            ? section(
                "PROJECTS",
                `
                  <div class="project-item">

                    <div class="item-title">
                      ${esc(
                        profile.projects.name
                      )}
                    </div>


                    ${
                      profile.projects.technologies
                        ? `
                          <div class="item-subtitle">

                            Technologies:
                            ${esc(
                              profile.projects
                                .technologies
                            )}

                          </div>
                        `
                        : ""
                    }


                    ${
                      profile.projects.description
                        ? `
                          <p>
                            ${esc(
                              profile.projects
                                .description
                            )}
                          </p>
                        `
                        : ""
                    }


                    ${
                      profile.projects.github
                        ? `
                          <div class="item-meta">

                            GitHub / Demo:
                            ${esc(
                              profile.projects.github
                            )}

                          </div>
                        `
                        : ""
                    }

                  </div>
                `
              )
            : ""
        }


        <!-- ============================================= -->
        <!-- EXPERIENCE -->
        <!-- ============================================= -->

        ${
          profile.experience.company
            ? section(
                "INTERNSHIP / EXPERIENCE",
                `
                  <div class="experience-item">

                    ${
                      profile.experience.role
                        ? `
                          <div class="item-title">
                            ${esc(
                              profile.experience.role
                            )}
                          </div>
                        `
                        : ""
                    }


                    <div class="item-subtitle">
                      ${esc(
                        profile.experience.company
                      )}
                    </div>


                    ${
                      profile.experience.duration
                        ? `
                          <div class="item-meta">
                            ${esc(
                              profile.experience
                                .duration
                            )}
                          </div>
                        `
                        : ""
                    }


                    ${
                      profile.experience.description
                        ? `
                          <p>
                            ${esc(
                              profile.experience
                                .description
                            )}
                          </p>
                        `
                        : ""
                    }

                  </div>
                `
              )
            : ""
        }


        <!-- ============================================= -->
        <!-- CERTIFICATIONS -->
        <!-- ============================================= -->

        ${
          profile.certifications
            ? section(
                "CERTIFICATIONS",
                `
                  <ul>
                    ${bulletList(
                      profile.certifications
                    )}
                  </ul>
                `
              )
            : ""
        }


        <!-- ============================================= -->
        <!-- ACHIEVEMENTS -->
        <!-- ============================================= -->

        ${
          profile.achievements
            ? section(
                "ACHIEVEMENTS",
                `
                  <ul>
                    ${bulletList(
                      profile.achievements
                    )}
                  </ul>
                `
              )
            : ""
        }


        <!-- ============================================= -->
        <!-- FRESHER CAREER FOCUS -->
        <!-- ============================================= -->

        ${
          isFresher
            ? section(
                "CAREER FOCUS",
                `
                  <p>
                    Seeking an opportunity to apply
                    academic knowledge, technical skills
                    and problem-solving abilities in a
                    professional environment while
                    continuously learning and contributing
                    to organizational goals.
                  </p>
                `
              )
            : ""
        }

      </div>

    `;


    // --------------------------------------------------------
    // INSERT INTO PREVIEW
    // --------------------------------------------------------

    if (resumePreview) {

      resumePreview.innerHTML =
        html;

    }


    // --------------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // --------------------------------------------------------

    try {

      localStorage.setItem(
        "lastAiResume",
        JSON.stringify(data)
      );


      localStorage.setItem(
        "resumeText",
        resumePreview
          ? resumePreview.innerText
          : ""
      );


      localStorage.setItem(
        "resumeTitle",
        `AI Resume - ${
          profile.personal.name
        }`
      );


      // Save complete profile
      localStorage.setItem(
        "aiResumeProfile",
        JSON.stringify(profile)
      );

    } catch (error) {

      console.warn(
        "Could not save resume:",
        error
      );

    }


    // Add professional styling
    addResumeStyles();


    // Scroll to preview
    if (previewSection) {

      previewSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  }


  // ==========================================================
  // EDUCATION RENDERER
  //
  // Shows ALL available education:
  //
  // B.Tech / Diploma
  // +
  // Intermediate
  // +
  // SSC
  //
  // ==========================================================

  function renderEducation(education) {

    if (!education) {
      return "";
    }


    const higher =
      education.higher || {};


    const intermediate =
      education.intermediate || {};


    const school =
      education.school || {};


    let content = "";


    // --------------------------------------------------------
    // HIGHER EDUCATION
    // --------------------------------------------------------

    if (
      higher.degree ||
      higher.college
    ) {

      content += `

        <div class="education-item">

          <div class="item-title">

            ${esc(
              higher.degree ||
              ""
            )}

            ${
              higher.branch
                ? ` — ${esc(
                    higher.branch
                  )}`
                : ""
            }

          </div>


          ${
            higher.college
              ? `
                <div class="item-subtitle">

                  ${esc(
                    higher.college
                  )}

                </div>
              `
              : ""
          }


          <div class="item-meta">

            ${
              higher.university
                ? esc(
                    higher.university
                  )
                : ""
            }


            ${
              higher.startYear ||
              higher.endYear
                ? `
                  | ${
                    esc(
                      higher.startYear ||
                      ""
                    )
                  }

                  ${
                    higher.endYear
                      ? ` – ${esc(
                          higher.endYear
                        )}`
                      : ""
                  }
                `
                : ""
            }


            ${
              higher.score
                ? `
                  | ${esc(
                    higher.score
                  )}
                `
                : ""
            }

          </div>

        </div>

      `;
    }


    // --------------------------------------------------------
    // INTERMEDIATE / 12TH
    // --------------------------------------------------------

    if (
      intermediate.course ||
      intermediate.college
    ) {

      content += `

        <div class="education-item">

          <div class="item-title">

            Intermediate / 12th

            ${
              intermediate.course
                ? ` — ${esc(
                    intermediate.course
                  )}`
                : ""
            }

          </div>


          ${
            intermediate.college
              ? `
                <div class="item-subtitle">

                  ${esc(
                    intermediate.college
                  )}

                </div>
              `
              : ""
          }


          <div class="item-meta">

            ${
              intermediate.board
                ? esc(
                    intermediate.board
                  )
                : ""
            }


            ${
              intermediate.year
                ? ` | ${esc(
                    intermediate.year
                  )}`
                : ""
            }


            ${
              intermediate.score
                ? ` | ${esc(
                    intermediate.score
                  )}`
                : ""
            }

          </div>

        </div>

      `;
    }


    // --------------------------------------------------------
    // SSC / 10TH
    // --------------------------------------------------------

    if (school.school) {

      content += `

        <div class="education-item">

          <div class="item-title">
            SSC / 10th
          </div>


          <div class="item-subtitle">

            ${esc(
              school.school
            )}

          </div>


          <div class="item-meta">

            ${
              school.board
                ? esc(
                    school.board
                  )
                : ""
            }


            ${
              school.year
                ? ` | ${esc(
                    school.year
                  )}`
                : ""
            }


            ${
              school.score
                ? ` | ${esc(
                    school.score
                  )}`
                : ""
            }

          </div>

        </div>

      `;
    }


    // --------------------------------------------------------
    // NOTHING ENTERED
    // --------------------------------------------------------

    if (!content) {
      return "";
    }


    return section(
      "EDUCATION",
      content
    );

  }


  // ==========================================================
  // PROFESSIONAL SUMMARY
  // ==========================================================

  function createProfessionalSummary(profile) {

    const role =
      profile.career.targetRole ||
      "professional";


    const skills =
      splitSkills(
        profile.skills || ""
      )
        .slice(0, 5)
        .join(", ");


    const education =
      profile.education?.higher;


    const degree =
      education?.degree ||
      "";


    const branch =
      education?.branch ||
      "";


    // --------------------------------------------------------
    // FRESHER SUMMARY
    // --------------------------------------------------------

    if (
      profile.career.experienceLevel ===
      "fresher"
    ) {

      return `
        Motivated and detail-oriented aspiring
        ${role} with a strong academic foundation
        ${degree
          ? `through ${degree}`
          : ""}
        ${branch
          ? ` in ${branch}`
          : ""}.
        Proficient in
        ${skills || "relevant technical skills"}.
        Strong problem-solving abilities,
        continuous learning mindset and enthusiasm
        for applying technical knowledge to
        real-world projects.
      `
        .replace(/\s+/g, " ")
        .trim();

    }


    // --------------------------------------------------------
    // GENERAL SUMMARY
    // --------------------------------------------------------

    return `
      Results-oriented ${role} with strong technical
      expertise in ${skills || "relevant technologies"}.
      Demonstrates problem-solving ability,
      adaptability and commitment to delivering
      effective solutions.
    `
      .replace(/\s+/g, " ")
      .trim();

  }


  // ==========================================================
  // SECTION BUILDER
  // ==========================================================

  function section(
    title,
    content
  ) {

    return `

      <section class="resume-section">

        <h3>
          ${title}
        </h3>


        <div class="resume-divider"></div>


        <div class="resume-content">

          ${content}

        </div>

      </section>

    `;

  }


  // ==========================================================
  // SPLIT SKILLS
  // ==========================================================

  function splitSkills(text) {

    if (!text) {
      return [];
    }


    return text
      .split(",")
      .map(
        skill =>
          skill.trim()
      )
      .filter(Boolean);

  }


  // ==========================================================
  // BULLET LIST
  // ==========================================================

  function bulletList(text) {

    if (!text) {
      return "";
    }


    return text

      .split(/\n|,/)

      .map(
        item =>
          item.trim()
      )

      .filter(Boolean)

      .map(
        item =>
          `
          <li>
            ${esc(item)}
          </li>
          `
      )

      .join("");

  }


  // ==========================================================
  // GET VALUE
  // ==========================================================

  function value(id) {

    const element =
      document.getElementById(id);


    if (!element) {
      return "";
    }


    return element.value
      ? element.value.trim()
      : "";

  }


  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function esc(text) {

    return String(
      text || ""
    )

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  function showLoading(show) {

    if (!loadingOverlay) {
      return;
    }


    loadingOverlay.style.display =
      show
        ? "flex"
        : "none";

  }


  // ==========================================================
  // EDIT
  // ==========================================================

  if (editBtn) {

    editBtn.addEventListener(
      "click",
      () => {

        if (previewSection) {

          previewSection.style.display =
            "none";

        }


        if (emptyState) {

          emptyState.style.display =
            "flex";

        }


        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

  }


  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  if (downloadPdfBtn) {

    downloadPdfBtn.addEventListener(
      "click",
      () => {

        if (!resumePreview) {

          alert(
            "Resume preview not found."
          );

          return;
        }


        const name =
          generatedResumeData
            ?.personal
            ?.name ||
          "Resume";


        html2pdf()

          .set({

            margin: 8,

            filename:
              `PrepMate_AI_${name}_Resume.pdf`,

            image: {

              type: "jpeg",

              quality: 0.98

            },

            html2canvas: {

              scale: 2,

              useCORS: true

            },

            jsPDF: {

              unit: "mm",

              format: "a4",

              orientation:
                "portrait"

            }

          })

          .from(resumePreview)

          .save();

      }
    );

  }


  // ==========================================================
  // DOWNLOAD DOCX
  // ==========================================================

  if (downloadDocxBtn) {

    downloadDocxBtn.addEventListener(
      "click",
      () => {

        if (
          !resumePreview ||
          !window.docx
        ) {

          alert(
            "DOCX library is not available."
          );

          return;
        }


        const name =
          generatedResumeData
            ?.personal
            ?.name ||
          "Resume";


        const lines =
          resumePreview.innerText

            .split("\n")

            .map(
              line =>
                line.trim()
            )

            .filter(Boolean);


        const children =
          lines.map(
            line => {

              return new window.docx.Paragraph({

                text: line,

                spacing: {
                  after: 120
                }

              });

            }
          );


        const doc =
          new window.docx.Document({

            sections: [

              {

                properties: {},

                children

              }

            ]

          });


        window.docx.Packer
          .toBlob(doc)
          .then(
            blob => {

              if (
                typeof saveAs ===
                "function"
              ) {

                saveAs(
                  blob,
                  `PrepMate_AI_${name}_Resume.docx`
                );

              } else {

                const url =
                  URL.createObjectURL(
                    blob
                  );


                const link =
                  document.createElement(
                    "a"
                  );


                link.href = url;

                link.download =
                  `PrepMate_AI_${name}_Resume.docx`;


                document.body.appendChild(
                  link
                );

                link.click();

                link.remove();

                URL.revokeObjectURL(
                  url
                );

              }

            }
          )

          .catch(
            error => {

              console.error(
                "DOCX error:",
                error
              );

              alert(
                "Unable to create DOCX."
              );

            }
          );

      }
    );

  }


  // ==========================================================
  // AUTO-FILL MANUAL RESUME
  // ==========================================================

  if (autoFillBtn) {

    autoFillBtn.addEventListener(
      "click",
      () => {

        if (!generatedResumeData) {

          alert(
            "Please generate an AI resume first."
          );

          return;
        }


        localStorage.setItem(

          "autoFillResumeData",

          JSON.stringify(
            generatedResumeData
          )

        );


        alert(
          "Resume data saved. Opening Manual Resume Builder..."
        );


        window.location.href =
          "manualResume.html";

      }
    );

  }


  // ==========================================================
  // PROFESSIONAL RESUME STYLES
  // ==========================================================

  function addResumeStyles() {

    if (
      document.getElementById(
        "professionalResumeStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "professionalResumeStyles";


    style.textContent = `

      .professional-resume {

        background: #ffffff;

        width: 100%;

        max-width: 760px;

        min-height: 1050px;

        margin: 0 auto;

        padding: 50px 55px;

        color: #202124;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        line-height: 1.5;

        box-sizing: border-box;

      }


      .resume-header {

        text-align: center;

        padding-bottom: 20px;

        border-bottom:
          2px solid #7041d8;

        margin-bottom: 25px;

      }


      .resume-header h1 {

        margin: 0;

        font-size: 30px;

        font-weight: 800;

        color: #111827;

      }


      .resume-header h2 {

        margin:
          6px 0 10px;

        font-size: 15px;

        color: #7041d8;

        font-weight: 600;

      }


      .resume-contact {

        display: flex;

        justify-content: center;

        align-items: center;

        gap: 12px;

        flex-wrap: wrap;

        color: #667085;

        font-size: 9px;

      }


      .resume-links {

        display: flex;

        justify-content: center;

        gap: 15px;

        margin-top: 5px;

        color: #7041d8;

        font-size: 9px;

      }


      .resume-section {

        margin-bottom: 22px;

      }


      .resume-section h3 {

        margin: 0;

        font-size: 12px;

        font-weight: 800;

        letter-spacing: 1px;

        color: #202124;

      }


      .resume-divider {

        height: 1px;

        background: #d9dce3;

        margin:
          6px 0 10px;

      }


      .resume-content {

        font-size: 10px;

        color: #454b55;

      }


      .resume-content p {

        margin:
          0 0 6px;

      }


      /* ================= EDUCATION ================= */

      .education-item {
        position: relative;
        margin-bottom: 14px;
        padding-left: 0;
      }

      .education-item:last-child {
        margin-bottom: 0;
      }

      .education-item .item-title {
        font-size: 10.5px;
        font-weight: 700;
        color: #202124;
        line-height: 1.35;
        margin-bottom: 2px;
      }

      .education-item .item-subtitle {
        font-size: 9.5px;
        font-weight: 500;
        color: #3f4652;
        line-height: 1.4;
        margin-bottom: 2px;
      }

      .education-item .item-meta {
        font-size: 8.8px;
        font-weight: 400;
        color: #707784;
        line-height: 1.4;
        margin: 0;
      }


      .item-title {

        font-weight: 700;

        color: #252b36;

        margin-bottom: 3px;

      }


      .item-title {
        font-size: 10.5px;
        font-weight: 700;
        color: #202124;
        margin-bottom: 3px;
        line-height: 1.4;
      }

      .item-subtitle {
        font-size: 9.5px;
        font-weight: 500;
        color: #454b55;
        margin-bottom: 2px;
        line-height: 1.4;
      }

      .item-meta {
        font-size: 8.8px;
        font-weight: 400;
        color: #707784;
        margin-bottom: 5px;
        line-height: 1.4;
      }


      .skills-grid {

        display: flex;

        flex-wrap: wrap;

        gap: 6px;

      }


      .skill-item {

        background: #f2edff;

        color: #5430a8;

        border:
          1px solid #e2d6ff;

        border-radius: 4px;

        padding:
          4px 8px;

        font-size: 9px;

        font-weight: 600;

      }


      .resume-content ul {

        margin:
          4px 0;

        padding-left: 17px;

      }


      .resume-content li {

        margin-bottom: 4px;

      }


      @media print {

        .professional-resume {

          margin: 0;

          box-shadow: none;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  // ==========================================================
  // AUTO LOAD PREVIOUS RESUME
  // ==========================================================

  try {

    const saved =
      localStorage.getItem(
        "lastAiResume"
      );


    if (saved) {

      console.log(
        "Previous AI resume found."
      );

    }

  } catch (error) {

    console.warn(
      "Unable to load saved resume."
    );

  }

});