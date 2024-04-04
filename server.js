const { Client } = require("pg");
const express = require("express");
require("dotenv").config();

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded( { extended: true }));

// Anslut till min databas
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: false,
    },
});

client.connect((err) => {
    if(err) {
        console.log("Fel vid anslutning" + err);
    } else {
        console.log("Ansluten till databasen...");
    }
});

// Routing för de olika sidorna
app.get("/", async(req, res) => {
    //Läsa ut från DB
    client.query("SELECT * FROM courses", (err, result) => {
        if(err) {
            console.log("Fel vid DB-fråga");
        } else {
            res.render("index", {
                courses: result.rows
            });
        }
    });

});

app.get("/addcourse", (req, res) => {
    res.render("addcourse");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/index", async(req, res) => {
    const courseName = req.body.name.trim(); // Ta bort mellanslag i början och slutet av strängen
    const courseCode = req.body.code.trim(); // Lagra code
    const progression = req.body.progression.trim(); // Lagra progression
    const syllabus = req.body.syllabus.trim(); // Lagra syllabus

    // Kontrollera om något av fälten är tomma eller bra innehåller mellanslag
    if (!courseName || !courseCode || !progression || !syllabus || /^\s*$/.test(courseName) || /^\s*$/.test(courseCode) || /^\s*$/.test(progression) || /^\s*$/.test(syllabus)) {
        // Om något fält är tomt eller innehåller endast mellanslag, visas en alertruta för användaren
        return res.send('<script>alert("Alla fält måste vara ifyllda med giltigt innehåll."); window.location.href = "/addcourse";</script>');
    } else {
        // Om alla fält är ifyllda, utförs SQL-frågan för att lägga till info i databasen
        try {
            const result = await client.query("INSERT INTO courses(course_name, course_code, progression, syllabus) VALUES($1, $2, $3, $4)",
                [courseName, courseCode, progression, syllabus]
            );
            res.redirect("/"); // Skickas till startsida
        } catch (error) {
            console.error("Fel vid hantering av SQL-fråga:", error);
            res.status(500).send("Ett fel uppstod vid behandlingen av din begäran.");
        }
    }
});

// Hantera POST-begäran för att ta bort en kurs
app.post("/removeCourse", async (req, res) => {
    const courseId = req.body.course_id; //Lagra id i en variabel

    try {
        // Ta bort kursen från databasen
        await client.query("DELETE FROM courses WHERE id = $1", [courseId]);
        console.log("Kurs borttagen från databasen");
        // Om borttagningen lyckas, skickas till startsidan 
        res.redirect("/");
    } catch (err) {
        console.error("Fel vid borttagning av kurs:", err);
        // Hantera fel
        res.status(500).send("Något gick fel vid borttagning av kursen.");
    }
});


//Starta server
app.listen(process.env.PORT, ()=> {
    console.log("Server startad på port: " + process.env.PORT);
});