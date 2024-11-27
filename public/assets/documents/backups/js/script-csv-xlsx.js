// Sélectionner les éléments DOM
const fileInput = document.getElementById('file-input');
const chartTitleInput = document.getElementById('chart-title');
const updateTitleButton = document.getElementById('update-title');
const chartColorInput = document.getElementById('chart-color');
const chartTypeSelect = document.getElementById('chart-type');
const xColumnSelect = document.getElementById('x-column');
const yColumnSelect = document.getElementById('y-column');
const exportPngButton = document.getElementById('export-png');
const exportPdfButton = document.getElementById('export-pdf');
const sheetSelect = document.getElementById('sheet-select');
const delimiterInput = document.getElementById("delimiter");
const chartCanvas = document.getElementById('chart');
const ctx = chartCanvas.getContext('2d');

// Variables pour stocker les données du graphique
let chart = null;
let chartData = [];
let columnNames = [];
let workbook = null;

// Fonction pour gérer l'importation du fichier
function handleFile(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;

            // Lire le fichier Excel avec les options personnalisées
            workbook = XLSX.read(data, {
                type: 'array',
                raw: true, // Lecture des données brutes
                dateNF: 'YYYY-MM-DD', // Format de date
            });

            // Vider et afficher le sélecteur de feuilles
            sheetSelect.innerHTML = '';
            workbook.SheetNames.forEach((sheetName, index) => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                sheetSelect.appendChild(option);
            });

            // Afficher les options de délimiteur et de feuille pour le CSV
            delimiterInput.style.display = "none";  // Masquer le champ délimiteur
            sheetSelect.style.display = "inline";   // Afficher le sélecteur de feuilles pour XLSX

            // Sélectionner la première feuille par défaut
            sheetSelect.selectedIndex = 0;
            handleSheetChange(); // Charger la première feuille
        };
        reader.readAsArrayBuffer(file);
    } else if (file && file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            // Lire directement le fichier CSV sans chercher de feuilles
            workbook = XLSX.read(data, {
                type: 'binary',
                raw: true,
                delimiter: ',',  // Délimiteur par défaut pour le CSV
            });

            // Masquer les options de délimiteur et de feuille pour le CSV
            delimiterInput.style.display = "none";
            sheetSelect.style.display = "none"; // Masquer le sélecteur de feuilles

            handleSheetChangeCSV(); // Appeler la fonction spécifique pour traiter le CSV
        };
        reader.readAsBinaryString(file);
    } else {
        alert("Veuillez importer un fichier Excel (.xlsx) ou CSV.");
    }
}

// Fonction pour charger les données d'une feuille spécifique (pour XLSX)
function handleSheetChange() {
    if (!workbook) return; // Vérifier si le workbook existe
    const selectedSheetName = sheetSelect.value;
    const selectedSheet = workbook.Sheets[selectedSheetName];
    
    if (!selectedSheet) {
        alert("La feuille sélectionnée est invalide.");
        return;
    }
    
    const sheetData = XLSX.utils.sheet_to_json(selectedSheet, {
        header: 1,
        raw: true,
        defval: "", // Remplacer les valeurs vides par des chaînes vides
        dateNF: 'YYYY-MM-DD', // Format de date
    });

    // Stocker les colonnes et les données
    columnNames = sheetData[0];
    chartData = sheetData.slice(1);

    // Remplir les sélecteurs de colonnes
    fillColumnSelectors();
}

// Fonction pour charger les données d'un CSV
function handleSheetChangeCSV() {
    if (!workbook) return; // Vérifier si le workbook existe
    const selectedSheet = workbook.Sheets[workbook.SheetNames[0]]; // Nous utilisons toujours la première feuille pour CSV
    
    const sheetData = XLSX.utils.sheet_to_json(selectedSheet, {
        header: 1,
        raw: true,
        defval: "", // Remplacer les valeurs vides par des chaînes vides
        dateNF: 'YYYY-MM-DD', // Format de date
    });

    // Stocker les colonnes et les données
    columnNames = sheetData[0];
    chartData = sheetData.slice(1);

    // Remplir les sélecteurs de colonnes
    fillColumnSelectors();
}

// Fonction pour remplir les sélecteurs de colonnes X et Y
function fillColumnSelectors() {
    xColumnSelect.innerHTML = '';
    yColumnSelect.innerHTML = '';

    columnNames.forEach((col, index) => {
        const optionX = document.createElement('option');
        optionX.value = index;
        optionX.textContent = col;
        xColumnSelect.appendChild(optionX);

        const optionY = document.createElement('option');
        optionY.value = index;
        optionY.textContent = col;
        yColumnSelect.appendChild(optionY);
    });
}

// Fonction pour générer le graphique
function generateChart() {
    const xColumnIndex = parseInt(xColumnSelect.value);
    const yColumnIndex = parseInt(yColumnSelect.value);

    const labels = chartData.map(row => row[xColumnIndex]);
    const data = chartData.map(row => row[yColumnIndex]);

    const chartType = chartTypeSelect.value;
    const chartColor = chartColorInput.value;

    const chartConfig = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: chartTitleInput.value || 'Graphique',
                data: data,
                backgroundColor: chartColor,
                borderColor: chartColor,
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: columnNames[xColumnIndex] } },
                y: { title: { display: true, text: columnNames[yColumnIndex] } },
            },
        },
    };

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, chartConfig);
}

// Fonction pour exporter en PNG
exportPngButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = 'chart.png';
    link.click();
});

// Fonction pour exporter en PDF
exportPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const imgData = chart.toBase64Image();
    pdf.addImage(imgData, 'PNG', 10, 10, 180, 160);
    pdf.save('chart.pdf');
});

// Mettre à jour le titre du graphique
updateTitleButton.addEventListener('click', generateChart);

// Écouter le changement de fichier
fileInput.addEventListener('change', handleFile);

// Appeler handleSheetChange au démarrage si un fichier est déjà chargé
if (fileInput.files.length > 0) {
    handleFile({ target: fileInput });
}
