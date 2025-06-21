document.addEventListener('DOMContentLoaded', () => {

    // === DOM ELEMENT SELECTION ===
    const logoUpload = document.getElementById('logo-upload');
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');
    const previewLogoContainer = document.getElementById('preview-logo-container');
    const previewLogo = document.getElementById('preview-logo');

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
    logoUpload.addEventListener('change', handleLogoUpload);
    receiptForm.addEventListener('input', updatePreview);
    addItemBtn.addEventListener('click', addItemRow);

    itemList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
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

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                logoPreview.src = e.target.result;
                previewLogo.src = e.target.result;
                logoPreviewContainer.style.display = 'block';
                previewLogoContainer.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }

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
                <td class="text-right">₦${price.toFixed(2)}</td>
            `;
            previewItemList.appendChild(previewRow);
        });

        previewTotal.textContent = `₦${total.toFixed(2)}`;
    }

    /**
     * Converts a file to a base64 Data URL.
     * @param {File} file The file to convert.
     * @returns {Promise<string|null>} A promise that resolves with the data URL.
     */
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    /**
     * REWRITTEN PDF GENERATION FUNCTION
     * Generates and downloads a PDF with a clean, dynamic layout.
     */
    async function downloadReceiptAsPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // --- Get form data ---
            const sellerName = document.getElementById('seller-name').value || 'Business Name';
            const buyerName = document.getElementById('buyer-name').value;
            const receiptDate = document.getElementById('receipt-date').value ? new Date(document.getElementById('receipt-date').value).toLocaleDateString() : 'N/A';
            const receiptId = previewReceiptId.textContent;
            const notes = document.getElementById('notes').value;
            const logoFile = logoUpload.files[0];
            const logoDataURL = await loadImage(logoFile);

            // --- Document Layout Constants ---
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            const priceColumnX = contentWidth * 0.75 + margin; // Price starts at 75% of content width
            const itemColumnWidth = contentWidth * 0.70; // Item description can take up 70% of width
            const lineHeight = 5; // mm
            const rowGap = 3; // mm
            let y = margin; // Current Y position

            // --- 1. Add Logo (if it exists) ---
            if (logoDataURL) {
                const img = new Image();
                img.src = logoDataURL;
                await new Promise(resolve => img.onload = resolve); // Wait for image to load to get dimensions

                const logoMaxWidth = 40;
                const aspectRatio = img.width / img.height;
                const logoWidth = Math.min(logoMaxWidth, img.width);
                const logoHeight = logoWidth / aspectRatio;

                doc.addImage(logoDataURL, 'PNG', pageWidth / 2 - logoWidth / 2, y, logoWidth, logoHeight);
                y += logoHeight + 8;
            }

            // --- 2. Add Seller Name ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text(sellerName, pageWidth / 2, y, { align: 'center' });
            y += 12;

            // --- 3. Add Receipt Details ---
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Date: ${receiptDate}`, margin, y);
            doc.text(`Receipt ID: ${receiptId}`, pageWidth - margin, y, { align: 'right' });
            y += lineHeight;
            if (buyerName) {
                doc.text(`Bill to: ${buyerName}`, margin, y);
                y += lineHeight;
            }
            y += 5;

            // --- 4. Add Table Header ---
            doc.setDrawColor(180);
            doc.line(margin, y, pageWidth - margin, y);
            y += lineHeight + rowGap;
            doc.setFont('helvetica', 'bold');
            doc.text('Item Description', margin, y);
            doc.text('Price', priceColumnX, y, { align: 'right' });
            y += lineHeight;
            doc.line(margin, y, pageWidth - margin, y);
            y += rowGap;

            // --- 5. Add Table Items (with dynamic row height) ---
            doc.setFont('helvetica', 'normal');
            let total = 0;
            const itemRows = itemList.querySelectorAll('.item-row');

            itemRows.forEach(row => {
                const name = row.querySelector('.item-name-input').value || 'Unnamed Item';
                const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
                total += price;

                // This splits the text into multiple lines if it's too long
                const nameLines = doc.splitTextToSize(name, itemColumnWidth);
                const rowHeight = nameLines.length * lineHeight;
                
                // Check if there is enough space for this item on the current page
                if (y + rowHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                doc.text(nameLines, margin, y);
                doc.text(`₦${price.toFixed(2)}`, priceColumnX, y, { align: 'right' });
                y += rowHeight + rowGap;
            });

            // --- 6. Add Total ---
            y += lineHeight;
            doc.setDrawColor(0); // Black line for total
            doc.line(priceColumnX - 10, y, pageWidth - margin, y);
            y += lineHeight + rowGap;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Total', margin, y);
            doc.text(`₦${total.toFixed(2)}`, priceColumnX, y, { align: 'right' });
            y += 15;

            // --- 7. Add Notes ---
            if (notes) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(100);
                const notesLines = doc.splitTextToSize(notes, contentWidth);
                doc.text(notesLines, margin, y);
            }
            
            // --- 8. Add Footer ---
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Generated with ReceiptGenie', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // --- 9. Save the PDF ---
            const pdfFileName = `Receipt_${sellerName.replace(/ /g, '_')}_${receiptId}.pdf`;
            doc.save(pdfFileName);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("An error occurred while generating the PDF. Please check the console for details.");
        }
    }
});