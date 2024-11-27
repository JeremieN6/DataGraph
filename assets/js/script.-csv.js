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
