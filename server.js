import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from 'path'; // Importer path pour gérer les chemins de fichiers
import { fileURLToPath } from 'url'; // Pour convertir une URL en chemin local

// require('dotenv').config();

// Obtenir le répertoire courant en utilisant import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // On en déduit le répertoire courant

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Servir le fichier index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Définir le répertoire des fichiers statiques (ici, public)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Route pour appeler l'API OpenAI
app.post("/api/generate-report", express.json(), async (req, res) => {
    const { dataSummary, objective } = req.body;

    // Vérifie si les données sont valides
    if (!dataSummary || !dataSummary.headers || !dataSummary.dataRows) {
        return res.status(400).json({ error: "Données invalides reçues." });
    }

        // Générer un prompt spécifique en fonction de l'objectif
        let prompt = `Voici des données issues d'un fichier CSV. Analyse-les et produis un rapport structuré en trois parties : 
        1. Statistiques principales (moyenne, médiane, min, max). 
        2. Tendances observées. 
        3. Recommandations basées sur l'analyse.
        
        Utilise des balises HTML comme `<h2>`, `<ul>`, `<em>`, `<strong>` et `<p>` pour organiser le contenu.`;
    
        switch (objective) {
            case "sales":
                prompt += " Objectif : Optimisation des ventes. Identifie les produits ou segments sous-performants et propose des stratégies pour améliorer les performances.";
                break;
            case "production":
                prompt += " Objectif : Amélioration de la production. Identifie les inefficacités ou anomalies et propose des améliorations pour réduire les coûts ou augmenter l'efficacité.";
                break;
            case "finance":
                prompt += " Objectif : Analyse financière. Identifie les indicateurs financiers clés, tendances des coûts et revenus, et propose des recommandations.";
                break;
            case "trends":
                prompt += " Objectif : Étude des tendances. Identifie les motifs récurrents ou changements significatifs et leurs implications.";
                break;
            default:
                prompt += " Objectif : Analyse Générale.";
        }

    try {
        // Appel à l'API OpenAI pour générer le rapport
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt + `\n\nDonnées : ${JSON.stringify(dataSummary)}`,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        // Vérifie si l'appel à OpenAI a réussi
        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({
                error: "Erreur lors de l'appel à l'API OpenAI",
                details: error,
            });
        }

        const data = await response.json();
        const aiReport = data.choices[0].message.content;

        // Envoie le rapport généré au client
        res.json({ report: aiReport });
    } catch (error) {
        console.error("Erreur lors de l'appel à l'API OpenAI :", error);
        res.status(500).json({
            error: "Erreur interne du serveur",
            details: error.message,
        });
    }
});


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
