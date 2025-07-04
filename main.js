document.addEventListener('DOMContentLoaded', () => {

    // === DOM ELEMENT SELECTION ===
    const receiptForm = document.getElementById('receipt-form');
    const itemList = document.getElementById('item-list');
    const addItemBtn = document.getElementById('add-item-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Preview Elements
    const previewSellerName = document.getElementById('preview-seller-name');
    const previewDate = document.getElementById('preview-date');
    const previewReceiptId = document.getElementById('preview-receipt-id');
    const buyerInfoPreview = document.getElementById('buyer-info-preview');
    const previewBuyerName = document.getElementById('preview-buyer-name');
    const previewItemList = document.getElementById('preview-item-list');
    const previewTotal = document.getElementById('preview-total');
    const previewNotes = document.getElementById('preview-notes');
    
    // === INITIAL SETUP ===
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receipt-date').value = today;

    const initialReceiptId = `#${Math.floor(10000 + Math.random() * 90000)}`;
    previewReceiptId.textContent = initialReceiptId;
    
    // === EVENT LISTENERS ===
    receiptForm.addEventListener('input', updatePreview);
    addItemBtn.addEventListener('click', addItemRow);
    
    itemList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-item-btn')) {
            if (itemList.children.length > 1) {
                e.target.closest('.item-row').remove();
                updatePreview();
            }
        }
    });

    downloadBtn.addEventListener('click', downloadReceiptAsPDF);

    // Initial call to populate the preview
    updatePreview();

    // === FUNCTIONS ===

    function addItemRow() {
        const newItemRow = document.createElement('div');
        newItemRow.className = 'item-row';
        newItemRow.innerHTML = `
            <div class="form-group item-name">
                <label>Item Name</label>
                <input type="text" class="item-name-input" placeholder="e.g., Graphic Design" required>
            </div>
            <div class="form-group item-price">
                <label>Price</label>
                <input type="number" class="item-price-input" placeholder="0.00" step="0.01" min="0" required>
            </div>
            <button type="button" class="remove-item-btn" aria-label="Remove Item">&times;</button>
        `;
        itemList.appendChild(newItemRow);
    }

    function updatePreview() {
        const sellerName = document.getElementById('seller-name').value;
        previewSellerName.textContent = sellerName || 'BUSINESS NAME';
        
        const buyerName = document.getElementById('buyer-name').value;
        if (buyerName) {
            previewBuyerName.textContent = buyerName;
            buyerInfoPreview.style.display = 'block';
        } else {
            buyerInfoPreview.style.display = 'none';
        }

        const receiptDate = document.getElementById('receipt-date').value;
        previewDate.textContent = receiptDate ? new Date(receiptDate).toLocaleDateString() : '--/--/----';

        previewNotes.textContent = document.getElementById('notes').value;

        previewItemList.innerHTML = '';
        let total = 0;
        const itemRows = itemList.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const name = row.querySelector('.item-name-input').value || 'Unnamed Item';
            const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
            if (price > 0) total += price;

            const previewRow = document.createElement('tr');
            previewRow.innerHTML = `
                <td>${name}</td>
                <td class="text-right">$${price.toFixed(2)}</td>
            `;
            previewItemList.appendChild(previewRow);
        });

        previewTotal.textContent = `$${total.toFixed(2)}`;
    }

    /**
     * NEW FUNCTION: Generates and downloads a PDF using jsPDF.
     */
    function downloadReceiptAsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // --- Get form data ---
        const sellerName = document.getElementById('seller-name').value || 'Business Name';
        const buyerName = document.getElementById('buyer-name').value;
        const receiptDate = document.getElementById('receipt-date').value ? new Date(document.getElementById('receipt-date').value).toLocaleDateString() : 'N/A';
        const receiptId = previewReceiptId.textContent;
        const notes = document.getElementById('notes').value;
        
        // --- Document constants ---
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        // --- Build the PDF ---

        // 1. Seller Name (Title)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(sellerName, pageWidth / 2, y, { align: 'center' });
        y += 12;

        // 2. Sub-details (Date, Receipt ID, Buyer)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Date: ${receiptDate}`, margin, y);
        doc.text(`Receipt ID: ${receiptId}`, pageWidth - margin, y, { align: 'right' });
        y += 7;
        if (buyerName) {
            doc.text(`Bill to: ${buyerName}`, margin, y);
            y += 7;
        }
        y += 5; // Extra space

        // 3. Line separator
        doc.setDrawColor(180); // Light grey
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // 4. Table Header
        doc.setFont('helvetica', 'bold');
        doc.text('Item Description', margin, y);
        doc.text('Price', pageWidth - margin, y, { align: 'right' });
        y += 7;
        doc.setDrawColor(220); // Lighter grey
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // 5. Table Items
        doc.setFont('helvetica', 'normal');
        let total = 0;
        const itemRows = itemList.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const name = row.querySelector('.item-name-input').value || 'Unnamed Item';
            const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
            total += price;

            doc.text(name, margin, y);
            doc.text(`$${price.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
            y += 8;
        });
        
        // 6. Total
        doc.setDrawColor(180); // Light grey
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Total', margin, y);
        doc.text(`$${total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
        y += 15;

        // 7. Notes
        if (notes) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(100); // Grey text
            // The splitTextToSize is important for handling multiline notes
            const splitNotes = doc.splitTextToSize(notes, pageWidth - (margin * 2));
            doc.text(splitNotes, margin, y);
        }
        
        // 8. Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Generated with ReceiptGenie`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // --- Save the PDF ---
        const pdfFileName = `Receipt_${sellerName.replace(/ /g, '_')}_${receiptId}.pdf`;
        doc.save(pdfFileName);
    }
});