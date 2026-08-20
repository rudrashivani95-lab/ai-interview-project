// Resume scoring with enhanced display and AI feedback

document.addEventListener("DOMContentLoaded", () => {

    const scoreBtn = document.getElementById("scoreResumeBtn");
    const autoFillBtn = document.getElementById("autoFillResumeBtn");
    const fixWithAiBtn = document.getElementById("fixWithAiBtn");
    const newAnalysisBtn = document.getElementById("newAnalysisBtn");

    const resumeText = document.getElementById("resumeText");
    const noResultsState = document.getElementById("noResultsState");
    const resultsSection = document.getElementById("resultsSection");
    const loadingSpinner = document.getElementById("loadingOverlay");

    let currentScoreData = null;

    if (!scoreBtn) return;

    function showLoading() {
        if (loadingSpinner) loadingSpinner.style.display = "flex";
    }

    function hideLoading() {
        if (loadingSpinner) loadingSpinner.style.display = "none";
    }

    scoreBtn.addEventListener("click", async () => {

        const text = resumeText.value.trim();

        const keywordsInput = document.getElementById("resumeKeywordsInput");

        const keywords = keywordsInput
            ? keywordsInput.value
                  .split(",")
                  .map(s => s.trim())
                  .filter(Boolean)
            : [];

        if (!text) {
            alert("Please enter resume text.");
            return;
        }

        showLoading();

        try {

            const { ok, data } = await window.apiPost(
                "/api/evaluate/resume",
                {
                    resumeText: text,
                    keywords
                }
            );

            hideLoading();

            if (!ok) {
                alert(data?.message || "Resume analysis failed.");
                return;
            }

            currentScoreData = data;

            displayScores(data);

        } catch (err) {

            hideLoading();
            alert(err.message);

        }

    });

    function displayScores(data) {

        if (noResultsState) noResultsState.style.display = "none";
        if (resultsSection) resultsSection.style.display = "block";

        const ats = parseInt(data.atsScore) || 0;
        const keyword = parseInt(data.keywordMatchScore) || 0;
        const grammar = parseInt(data.grammarScore) || 0;
        const length = parseInt(data.lengthScore) || 0;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value + "%";
        };

        const setBar = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.style.width = value + "%";
        };

        setText("atsScore", ats);
        setText("keywordScore", keyword);
        setText("grammarScore", grammar);
        setText("lengthScore", length);

        setBar("atsScoreBar", ats);
        setBar("keywordScoreBar", keyword);
        setBar("grammarScoreBar", grammar);
        setBar("lengthScoreBar", length);

        displayFeedback(data);

    }

    function displayFeedback(data) {

        const strengthsList = document.getElementById("strengthsList");
        const weakList = document.getElementById("weakSentencesList");
        const suggestionsList = document.getElementById("suggestionsList");

        if (strengthsList) {

            const strengths = data.strengths || [
                "Good resume format",
                "Professional layout"
            ];

            strengthsList.innerHTML = strengths
                .map(s => `<li>${s}</li>`)
                .join("");

        }

        if (weakList) {

            const weak = data.weakSentences || [];

            if (weak.length === 0) {

                weakList.innerHTML =
                    "<p>No weak sentences found.</p>";

            } else {

                weakList.innerHTML = weak
                    .map(
                        item => `
                    <div class="weak-sentence-item">
                        <strong>${item.sentence}</strong>
                        <br>
                        💡 ${item.suggestion}
                    </div>
                `
                    )
                    .join("");

            }

        }

        if (suggestionsList) {

            const suggestions = data.suggestions || [
                "Use more action verbs.",
                "Add measurable achievements.",
                "Improve ATS keywords."
            ];

            suggestionsList.innerHTML = suggestions
                .map(s => `<li>${s}</li>`)
                .join("");

        }

    }

    if (autoFillBtn) {

        autoFillBtn.addEventListener("click", () => {

            const resume = localStorage.getItem("resumeText");

            const lastResume = JSON.parse(
                localStorage.getItem("lastAiResume") || "null"
            );

            if (!resume) {
                alert("Generate AI Resume first.");
                return;
            }

            resumeText.value = resume;

            const keywordsInput =
                document.getElementById("resumeKeywordsInput");

            if (keywordsInput)
                keywordsInput.value = lastResume?.skills || "";

        });

    }

    if (fixWithAiBtn) {

        fixWithAiBtn.addEventListener("click", async () => {

            if (!currentScoreData) {
                alert("Analyze resume first.");
                return;
            }

            showLoading();

            try {

                const { ok, data } = await window.apiPost(
                    "/api/ai/resume/fix",
                    {
                        resumeText: resumeText.value,
                        weakSentences:
                            currentScoreData.weakSentences || []
                    }
                );

                hideLoading();

                if (!ok) {
                    alert(data?.message || "AI Fix Failed");
                    return;
                }

                resumeText.value = data.improvedResume;

                alert("Resume improved successfully.");

            } catch (err) {

                hideLoading();
                alert(err.message);

            }

        });

    }

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener("click", () => {

            resumeText.value = "";

            const keywords =
                document.getElementById("resumeKeywordsInput");

            if (keywords) keywords.value = "";

            if (resultsSection)
                resultsSection.style.display = "none";

            if (noResultsState)
                noResultsState.style.display = "block";

            currentScoreData = null;

        });

    }

});