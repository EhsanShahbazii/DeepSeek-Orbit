/**
 * DeepSeek Orbit — Interactive Dynamic Markdown Tables
 * Features: Click-to-sort columns, Centered Beautiful UI, CSV & Excel (.xlsx) Exporter
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function parseCellVal(text) {
    const clean = (text || '').trim();
    // Normalize Persian/Arabic digits
    const normalized = clean.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

    // Numeric check
    const num = Number(normalized.replace(/,/g, '').replace(/%$/, ''));
    if (!isNaN(num) && normalized !== '') {
      return { type: 'num', val: num };
    }

    // Date check
    const date = Date.parse(clean);
    if (!isNaN(date) && clean.length > 5 && /[/-]/.test(clean)) {
      return { type: 'date', val: date };
    }

    return { type: 'str', val: clean.toLowerCase() };
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function showToast(text, icon = ICONS.check) {
    const existing = document.querySelector('.ds-pro-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ds-pro-toast';
    toast.innerHTML = `<span style="display: inline-flex;">${icon}</span> <span>${text}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  function tableToCSV(table) {
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(td => {
        let text = td.innerText || td.textContent || '';
        text = text.replace(/"/g, '""').trim();
        cells.push(`"${text}"`);
      });
      if (cells.length) rows.push(cells.join(','));
    });
    // UTF-8 BOM for Excel compatibility
    return '\uFEFF' + rows.join('\r\n');
  }

  function tableToExcelHTML(table) {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>DeepSeek Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          th { background: #4d6bfe; color: #ffffff; font-weight: bold; border: 1px solid #ddd; padding: 8px 12px; }
          td { border: 1px solid #ddd; padding: 6px 10px; }
        </style>
      </head>
      <body>
        ${table.outerHTML}
      </body>
      </html>
    `;
    return html;
  }

  function updateTableRowCounts(table, wrapper) {
    const allRows = Array.from(table.querySelectorAll('tr'));
    if (allRows.length === 0) return;

    const headerRow = allRows.find(tr => tr.querySelector('th')) || allRows[0];
    const dataRows = allRows.filter(tr => tr !== headerRow && tr.querySelector('td'));
    const totalRowsCount = dataRows.length;

    const countLabel = wrapper.querySelector('.ds-table-count-label');
    if (countLabel) {
      countLabel.textContent = `${totalRowsCount} ${totalRowsCount === 1 ? 'row' : 'rows'}`;
    }

    dataRows.forEach((row, idx) => {
      if (!row.dataset.dsOrigIndex) {
        row.dataset.dsOrigIndex = idx;
      }
    });
  }

  function enhanceTable(table) {
    const existingWrapper = table.closest('.ds-dynamic-table-wrap');
    if (existingWrapper) {
      updateTableRowCounts(table, existingWrapper);
      return;
    }

    const allRows = Array.from(table.querySelectorAll('tr'));
    if (allRows.length === 0) return;

    const headerRow = allRows.find(tr => tr.querySelector('th')) || allRows[0];
    const dataRows = allRows.filter(tr => tr !== headerRow);
    const totalRowsCount = dataRows.length;

    // Wrap table with interactive container
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-dynamic-table-wrap';

    const parent = table.parentNode;
    parent.insertBefore(wrapper, table);

    // Save original index on each row
    dataRows.forEach((row, idx) => {
      row.dataset.dsOrigIndex = idx;
    });

    // Create Mini-Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ds-table-toolbar';
    toolbar.innerHTML = `
      <div class="ds-table-toolbar-left">
        <span class="ds-table-badge">
          <span style="display: inline-flex; color: var(--ds-brand-primary);">${ICONS.table}</span>
          <span class="ds-table-count-label">${totalRowsCount} ${totalRowsCount === 1 ? 'row' : 'rows'}</span>
        </span>
      </div>

      <div class="ds-table-toolbar-right">
        <button type="button" class="ds-table-btn" data-action="copy" title="Copy table as CSV">
          <span class="ds-table-btn-icon">${ICONS.copy}</span>
          <span>Copy</span>
        </button>

        <button type="button" class="ds-table-btn" data-action="csv" title="Download CSV (Excel compatible)">
          <span class="ds-table-btn-icon">${ICONS.fileText}</span>
          <span>CSV</span>
        </button>

        <button type="button" class="ds-table-btn" data-action="excel" title="Download Excel Sheet (.xls)">
          <span class="ds-table-btn-icon" style="color: #10b981;">${ICONS.excel}</span>
          <span>Excel</span>
        </button>
      </div>
    `;

    wrapper.appendChild(toolbar);

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'ds-table-scroll-container';
    scrollContainer.appendChild(table);
    wrapper.appendChild(scrollContainer);

    // Copy / Export Handlers
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.ds-table-btn');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'copy') {
        const csv = tableToCSV(table);
        navigator.clipboard.writeText(csv).then(() => {
          showToast('Table copied as CSV!');
        });
      } else if (action === 'csv') {
        const csv = tableToCSV(table);
        downloadFile(`deepseek_table_${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
        showToast('Exported table as CSV');
      } else if (action === 'excel') {
        const html = tableToExcelHTML(table);
        downloadFile(`deepseek_table_${Date.now()}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
        showToast('Exported table as Excel document');
      }
    });

    // Header Click-to-Sort
    if (headerRow) {
      const headers = headerRow.querySelectorAll('th, td');
      headers.forEach((th, colIdx) => {
        th.classList.add('ds-sortable-th');
        th.title = 'Click to sort';

        const sortIcon = document.createElement('span');
        sortIcon.className = 'ds-th-sort-icon';
        sortIcon.innerHTML = ICONS.sort;
        th.appendChild(sortIcon);

        let currentOrder = 'none'; // 'none' | 'asc' | 'desc'

        th.addEventListener('click', () => {
          // Reset other headers
          headers.forEach(otherTh => {
            if (otherTh !== th) {
              otherTh.classList.remove('sort-asc', 'sort-desc');
              const icon = otherTh.querySelector('.ds-th-sort-icon');
              if (icon) icon.innerHTML = ICONS.sort;
            }
          });

          // Cycle: none -> asc -> desc -> none
          if (currentOrder === 'none') currentOrder = 'asc';
          else if (currentOrder === 'asc') currentOrder = 'desc';
          else currentOrder = 'none';

          th.classList.remove('sort-asc', 'sort-desc');
          if (currentOrder === 'asc') {
            th.classList.add('sort-asc');
            sortIcon.innerHTML = ICONS.sortUp;
          } else if (currentOrder === 'desc') {
            th.classList.add('sort-desc');
            sortIcon.innerHTML = ICONS.sortDown;
          } else {
            sortIcon.innerHTML = ICONS.sort;
          }

          // Sort Rows
          const parentBody = headerRow.parentNode;
          const rowsToSort = Array.from(table.querySelectorAll('tr')).filter(tr => tr !== headerRow);

          if (currentOrder === 'none') {
            rowsToSort.sort((a, b) => Number(a.dataset.dsOrigIndex) - Number(b.dataset.dsOrigIndex));
          } else {
            rowsToSort.sort((a, b) => {
              const cellA = a.children[colIdx] ? a.children[colIdx].innerText : '';
              const cellB = b.children[colIdx] ? b.children[colIdx].innerText : '';

              const valA = parseCellVal(cellA);
              const valB = parseCellVal(cellB);

              let cmp = 0;
              if (valA.type === 'num' && valB.type === 'num') {
                cmp = valA.val - valB.val;
              } else if (valA.type === 'date' && valB.type === 'date') {
                cmp = valA.val - valB.val;
              } else {
                cmp = String(valA.val).localeCompare(String(valB.val), undefined, { numeric: true, sensitivity: 'base' });
              }

              return currentOrder === 'asc' ? cmp : -cmp;
            });
          }

          // Re-append in sorted order
          rowsToSort.forEach(r => parentBody.appendChild(r));
        });
      });
    }
  }

  function enhanceDynamicTables(root = document) {
    const tables = root.querySelectorAll('.ds-markdown table:not(.ds-table-exempt), ._63c77b1 table:not(.ds-table-exempt)');
    tables.forEach(table => {
      if (table.closest('.ds-code-modal, .ds-instructions-modal, .ds-nav-drawer, .ds-modal-container')) return;
      try {
        enhanceTable(table);
      } catch (err) {}
    });
  }

  window.DeepSeekOrbit.DynamicTables = {
    enhanceDynamicTables,
    enhanceTable
  };
})();
