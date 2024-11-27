require('dotenv').config();

// Sélection des éléments DOM
const fileInput = document.getElementById("file-input");
const chartTypeSelect = document.getElementById("chart-type");
const xColumnSelect = document.getElementById("x-column");
const yColumnSelect = document.getElementById("y-column");
const chartTitleInput = document.getElementById("chart-title");
const updateTitleButton = document.getElementById("update-title");
const chartColorInput = document.getElementById("chart-color");
const exportPngButton = document.getElementById("export-png");
const exportPdfButton = document.getElementById("export-pdf");
const canvas = document.getElementById("chart");

let chartInstance = null; // Instance du graphique actuel
let parsedData = null; // Données CSV stockées globalement

// Gestion des événements
fileInput.addEventListener("change", handleFile);
chartTypeSelect.addEventListener("change", updateChart);
updateTitleButton.addEventListener("click", updateChart);
chartColorInput.addEventListener("input", updateChart);
xColumnSelect.addEventListener("change", updateChart);
yColumnSelect.addEventListener("change", updateChart);
exportPngButton.addEventListener("click", exportToPNG);
exportPdfButton.addEventListener("click", exportToPDF);

// Fonction pour gérer l'importation du fichier CSV
function handleFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const csvData = e.target.result;
            try {
                parsedData = parseCSV(csvData); // Stocke les données dans parsedData
                if (parsedData.headers.length > 0) {
                    populateColumnSelectors(parsedData.headers);
                    createChart(parsedData);
                } else {
                    alert("Le fichier CSV est vide ou invalide.");
                }
            } catch (error) {
                alert("Erreur lors du traitement du fichier CSV : " + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Fonction pour parser le CSV
function parseCSV(data) {
    const rows = data.trim().split("\n").map(row => row.split(","));
    const headers = rows[0].map(header => header.trim());
    const dataRows = rows.slice(1).map(row =>
        row.map((cell, index) => (index > 0 && !isNaN(cell) ? Number(cell) : cell.trim()))
    );
    const myData = { headers, dataRows }
    console.log({myData});
    return { headers, dataRows };
}

// Fonction pour nettoyer les données CSV
function cleanCSVData(dataRows) {
    return dataRows.map(row => row.map(value => value.toString().replace(/[^0-9a-zA-Z .-]/g, "").trim()));
}

// Fonction pour remplir les sélecteurs de colonnes
function populateColumnSelectors(headers) {
    xColumnSelect.innerHTML = headers.map(header => `<option value="${header}">${header}</option>`).join("");
    yColumnSelect.innerHTML = headers.map(header => `<option value="${header}">${header}</option>`).join("");

    xColumnSelect.value = headers[0] || "";
    yColumnSelect.value = headers[1] || "";
}

// Fonction pour créer un graphique
function createChart({ headers, dataRows }) {
    const xColumn = xColumnSelect.value;
    const yColumn = yColumnSelect.value;

    const xIndex = headers.indexOf(xColumn);
    const yIndex = headers.indexOf(yColumn);

    if (xIndex === -1 || yIndex === -1) {
        alert("Veuillez sélectionner des colonnes valides.");
        return;
    }

    const cleanedDataRows = cleanCSVData(dataRows);
    const labels = cleanedDataRows.map(row => row[xIndex]);
    const values = cleanedDataRows.map(row => parseFloat(row[yIndex]));

    if (values.some(value => isNaN(value))) {
        alert("La colonne Y doit contenir uniquement des nombres.");
        return;
    }

    const ctx = canvas.getContext("2d");
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: chartTypeSelect.value,
        data: {
            labels: labels,
            datasets: [
                {
                    label: chartTitleInput.value || "Graphique",
                    data: values,
                    backgroundColor:
                        chartTypeSelect.value === "pie" ? generateRandomColors(values.length) : chartColorInput.value,
                    borderColor: chartColorInput.value,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: chartTypeSelect.value !== "bar",
                },
                title: {
                    display: !!chartTitleInput.value,
                    text: chartTitleInput.value,
                },
            },
            scales:
                chartTypeSelect.value !== "pie"
                    ? {
                          y: {
                              beginAtZero: true,
                          },
                      }
                    : {},
        },
    });
}

// Fonction pour générer des couleurs aléatoires
function generateRandomColors(length) {
    return Array.from({ length }, () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 50%)`;
    });
}

// Fonction pour mettre à jour le graphique
function updateChart() {
    if (!parsedData) {
        alert("Veuillez d'abord importer un fichier CSV.");
        return;
    }

    createChart(parsedData); // Recrée le graphique avec les nouvelles options
}

// Exporter le graphique en PNG
function exportToPNG() {
    const link = document.createElement("a");
    link.download = "graphique.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// Exporter le graphique en PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf; // Import depuis le contexte global
    const chartImage = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    pdf.addImage(chartImage, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("graphique.pdf");
}



    document.getElementById('generateAIReport').addEventListener('click', async () => {

        // Vérifier si parsedData existe et est valide
        if (!parsedData || !parsedData.headers || !parsedData.dataRows) {
            alert("Veuillez importer un fichier CSV ou XLSX valide.");
            return;
        }

        try {
            const reportText = await generateAIReport(parsedData);
            document.getElementById('reportOutput').innerText = reportText;
        } catch (error) {
            console.error("Erreur lors de la génération du rapport:", error);
            alert("Une erreur est survenue lors de la génération du rapport.");
        }
    });

    async function generateAIReport(parsedData) {

    //Appel API
    const headers = parsedData.headers; // ['Mois', 'Ventes', 'Profit']
    const rows = parsedData.dataRows; // Données des mois

    // Construction du texte à partir des données
    let dataSummary = `Voici les données du tableau :\n\n`;

    dataSummary += headers.join(" | ") + "\n"; // En-têtes
    dataSummary += "-".repeat(headers.join(" | ").length) + "\n"; // Ligne de séparation

    rows.forEach((row) => {
    dataSummary += row.join(" | ") + "\n"; // Lignes de données
    });

    console.log(dataSummary);


    const messages = [
        { role: "system", content: "Tu es un assistant qui analyse des données et génère des rapports." },
        { role: "user", content: `
            Analyse ces données et génère un rapport textuel en identifiant les points clés :
            ${dataSummary}

            Indique :
            - Le mois avec les ventes les plus élevées et le profit le plus élevé.
            - Le mois avec les ventes les plus faibles.
            - Les tendances générales (augmentation/diminution).
            - Les recommandations pour améliorer les ventes et les profits.
        ` },
    ];

    // const prompt = `
    // Analyse ces données et génère un rapport textuel en identifiant les points clés :
    // ${dataSummary}

    // Indique :
    // - Le mois avec les ventes les plus élevées et le profit le plus élevé.
    // - Le mois avec les ventes les plus faibles.
    // - Les tendances générales (augmentation/diminution).
    // - Les recommandations pour améliorer les ventes et les profits.
    // `;
    const API_KEY = process.env.OPENAI_API_KEY; // Remplace par ta clé API.
  
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Modèle utilisé
                messages: messages, // Utilisation correcte des messages
                max_tokens: 500, // Ajuste selon la longueur souhaitée
                temperature: 0.7, // Ajuste pour varier la créativité
            }),
        });

        // Vérification de la réponse
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur API:", errorData);
            throw new Error(`Erreur API OpenAI: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.choices[0].message.content; // Correct pour l'endpoint chat/completions
    } catch (error) {
        console.error("Erreur lors de la génération du rapport:", error);
        throw error;
    }
  };
  
  