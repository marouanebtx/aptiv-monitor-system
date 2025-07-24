document.addEventListener("DOMContentLoaded", function () {
  // Initialize Tabulator (same structure as your Excel)
  const table = new Tabulator("#action-table", {
    height: "calc(100vh - 250px)",
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
        editorParams: { values: ["O", "25%", "50%", "75%", "100%"] },
        width: 100,
      },
    ],
    data: generateInitialData(), // Pre-fills 20 empty rows like your template
  });

  // Generate initial empty data (matching your Excel)
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

  // Add new row (auto-increments "Numero")
  document.getElementById("add-row").addEventListener("click", function () {
    const newNumero = table.getData().length + 1;
    table.addRow({
      numero: newNumero,
      famille: "",
      description: "",
      cause: "",
      action: "",
      responsable: "",
      date: "",
      statut: "",
    });
  });

  // Excel Export (main function)
  document
    .getElementById("export-excel")
    .addEventListener("click", function () {
      // Prepare data with French headers
      const excelData = [
        [
          "Numero",
          "Famille",
          "Description",
          "Cause",
          "Action",
          "Responsable",
          "Date",
          "Statut",
        ], // Headers
        ...table
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
      ];

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plan d'action");

      // Export file (name format: Plan-Action-APTIV-YYYY-MM-DD.xlsx)
      XLSX.writeFile(
        wb,
        `Plan-Action-APTIV-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    });
});
