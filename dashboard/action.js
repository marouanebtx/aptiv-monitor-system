document.addEventListener("DOMContentLoaded", function () {
  // Initialize Tabulator with your exact Excel structure
  const table = new Tabulator("#action-table", {
    height: "calc(100vh - 180px)", // Dynamic height
    layout: "fitColumns",
    columns: [
      {
        title: "Numero",
        field: "numero",
        width: 80,
        editor: "number",
        editable: false,
      },
      { title: "Famille", field: "famille", editor: "input", width: 120 },
      {
        title: "Description",
        field: "description",
        editor: "input",
        width: 150,
      },
      { title: "Cause", field: "cause", editor: "textarea", width: 200 },
      { title: "Action", field: "action", editor: "textarea", width: 200 },
      {
        title: "Responsable",
        field: "responsable",
        editor: "input",
        width: 120,
      },
      { title: "Date", field: "date", editor: "date", width: 100 },
      {
        title: "Statut",
        field: "statut",
        editor: "select",
        editorParams: {
          // values: ["", "En cours", "Terminé", "En attente"],
          values: ["O", "25%", "50%", "75%", "100%"],
        },
        width: 100,
      },
    ],
    data: generateInitialData(),
  });

  // Generate initial data matching your Excel structure
  function generateInitialData() {
    const data = [];
    for (let i = 1; i <= 20; i++) {
      data.push({
        numero: i,
        famille: "",
        description: "",
        cause: "",
        action: "",
        responsable: "",
        date: "",
        statut: "",
      });
    }
    return data;
  }

  // Add row button
  document.getElementById("add-row").addEventListener("click", function () {
    const newNumero = table.getData().length + 1;
    table.addRow(
      {
        numero: newNumero,
        famille: "",
        description: "",
        cause: "",
        action: "",
        responsable: "",
        date: "",
        statut: "",
      },
      false
    );
  });

  // Export to PDF with French labels
  document.getElementById("export-pdf").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 62, 80);
    doc.setFontSize(16);
    doc.text("Plan d'action APTIV", 105, 15, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString("fr-FR")}`, 105, 22, {
      align: "center",
    });

    // AutoTable
    doc.autoTable({
      head: [
        [
          "Numero",
          "Famille",
          "Description",
          "Cause",
          "Action",
          "Responsable",
          "Date",
          "Statut",
        ],
      ],
      body: table
        .getData()
        .map((row) => [
          row.numero,
          row.famille,
          row.description,
          row.cause,
          row.action,
          row.responsable,
          row.date,
          row.statut,
        ]),
      startY: 30,
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
      },
      styles: {
        font: "cairo",
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: "auto" },
        4: { cellWidth: "auto" },
        5: { cellWidth: "auto" },
        6: { cellWidth: "auto" },
        7: { cellWidth: "auto" },
      },
      margin: { horizontal: 5 },
    });

    doc.save(`Plan-Action-APTIV-${new Date().toISOString().slice(0, 10)}.pdf`);
  });
});
