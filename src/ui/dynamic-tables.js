/**
 * DeepSeek Orbit — Interactive Dynamic Markdown Tables
 * Features: Click-to-sort columns, In-table Search Filtering, CSV & Excel (.xlsx) Exporter
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function parseCellVal(text) {
    const clean = (text || '').trim();
    // Check Persian/Arabic digits and normalize to western
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
    // UTF-8 BOM (\uFEFF) for Excel compatibility with Persian/Arabic characters
    return '\uFEFF' + rows.join('\r\n');
  }

  function tableToExcelHTML(table) {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>DeepSeek Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { background: #4d6bfe; color: #ffffff; font-weight: bold; border: 1px solid #ddd; padding: 8px; }
          td { border: 1px solid #ddd; padding: 6px 8px; }
        </style>
      </head>
      <body>
        ${table.outerHTML}
      </body>
      </html>
    `;
    return html;
  }

  function enhanceTable(table) {
    if (table.dataset.dsTableEnhanced === 'true') return;
    if (!table.querySelector('tbody tr') && !table.querySelector('tr')) return;

    table.dataset.dsTableEnhanced = 'true';

    // Wrap table with interactive container
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-dynamic-table-wrap';

    const parent = table.parentNode;
    parent.insertBefore(wrapper, table);

    // Initial rows
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody') || table;
    const headerRow = thead ? thead.querySelector('tr') : table.querySelector('tr');
    const dataRows = Array.from(tbody.querySelectorAll('tr')).filter(tr => tr !== headerRow);

    // Save original index on each row
    dataRows.forEach((row, idx) => {
      row.dataset.dsOrigIndex = idx;
    });

    const totalRowsCount = dataRows.length;

    // Create Mini-Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ds-table-toolbar';
    toolbar.innerHTML = `
      <div class="ds-table-toolbar-left">
        <span class="ds-table-badge">
          <span style="display: inline-flex; color: var(--ds-brand-primary);">${ICONS.table}</span>
          <span class="ds-table-count-label">${totalRowsCount} rows</span>
        </span>
      </div>

      <div class="ds-table-toolbar-right">
        <div class="ds-table-search-box">
          <span style="color: var(--ds-text-muted); display: inline-flex;">${ICONS.search}</span>
          <input type="text" class="ds-table-search-input" placeholder="Filter rows..." autocomplete="off" spellcheck="false" />
        </div>

        <button type="button" class="ds-table-btn" data-action="copy" title="Copy as CSV">
          <span class="ds-table-btn-icon">${ICONS.copy}</span>
          <span>Copy</span>
        </button>

        <button type="button" class="ds-table-btn" data-action="csv" title="Download CSV (Excel compatible)">
          <span class="ds-table-btn-icon">${ICONS.fileText}</span>
          <span>CSV</span>
        </button>

        <button type="button" class="ds-table-btn" data-action="excel" title="Download Excel Document (.xls)">
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

    const searchInput = toolbar.querySelector('.ds-table-search-input');
    const countLabel = toolbar.querySelector('.ds-table-count-label');

    // In-Table Search Filter
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      let visibleCount = 0;

      dataRows.forEach(row => {
        const text = (row.innerText || row.textContent || '').toLowerCase();
        if (!q || text.includes(q)) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      countLabel.textContent = q ? `${visibleCount} of ${totalRowsCount} rows` : `${totalRowsCount} rows`;
    });

    // Copy / Export Handlers
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.ds-table-btn');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'copy') {
        const csv = tableToCSV(table);
        navigator.clipboard.writeText(csv).then(() => {
          const orig = btn.querySelector('span:last-child').textContent;
          btn.querySelector('span:last-child').textContent = 'Copied!';
          setTimeout(() => {
            btn.querySelector('span:last-child').textContent = orig;
          }, 2000);
        });
      } else if (action === 'csv') {
        const csv = tableToCSV(table);
        downloadFile(`deepseek_table_${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
      } else if (action === 'excel') {
        const html = tableToExcelHTML(table);
        downloadFile(`deepseek_table_${Date.now()}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
      }
    });

    // Header Click-to-Sort
    if (headerRow) {
      const headers = headerRow.querySelectorAll('th');
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

          // Cycle state: none -> asc -> desc -> none
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
          const rowsToSort = Array.from(tbody.querySelectorAll('tr')).filter(tr => tr !== headerRow);

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
          rowsToSort.forEach(r => tbody.appendChild(r));
        });
      });
    }
  }

  function enhanceDynamicTables(root = document) {
    const tables = root.querySelectorAll('.ds-markdown table, table:not(.ds-table-exempt)');
    tables.forEach(table => {
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
