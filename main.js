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
    
    const receiptPreview = document.getElementById('receipt-preview');

    // === INITIAL SETUP ===
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receipt-date').value = today;

    // Generate a random receipt ID on load
    const initialReceiptId = `#${Math.floor(10000 + Math.random() * 90000)}`;
    previewReceiptId.textContent = initialReceiptId;
    
    // === EVENT LISTENERS ===
    receiptForm.addEventListener('input', updatePreview);
    addItemBtn.addEventListener('click', addItemRow);
    
    // Use event delegation for removing items
    itemList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-item-btn')) {
            // Prevent removing the last item
            if (itemList.children.length > 1) {
                e.target.closest('.item-row').remove();
                updatePreview();
            }
        }
    });

    downloadBtn.addEventListener('click', downloadReceipt);

    // Initial call to populate the preview
    updatePreview();

    // === FUNCTIONS ===

    /**
     * Adds a new item row to the form.
     */
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

    /**
     * Main function to update the live preview based on form inputs.
     */
    function updatePreview() {
        // Update Seller Name
        const sellerName = document.getElementById('seller-name').value;
        previewSellerName.textContent = sellerName || 'BUSINESS NAME';
        
        // Update Buyer Name
        const buyerName = document.getElementById('buyer-name').value;
        if (buyerName) {
            previewBuyerName.textContent = buyerName;
            buyerInfoPreview.style.display = 'block';
        } else {
            buyerInfoPreview.style.display = 'none';
        }

        // Update Date
        const receiptDate = document.getElementById('receipt-date').value;
        previewDate.textContent = receiptDate ? new Date(receiptDate).toLocaleDateString() : '--/--/----';

        // Update Notes
        previewNotes.textContent = document.getElementById('notes').value;

        // Update Items and Calculate Total
        previewItemList.innerHTML = '';
        let total = 0;
        const itemRows = itemList.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const nameInput = row.querySelector('.item-name-input');
            const priceInput = row.querySelector('.item-price-input');
            const name = nameInput.value || 'Unnamed Item';
            const price = parseFloat(priceInput.value) || 0;
            
            if (price > 0) {
                 total += price;
            }

            const previewRow = document.createElement('tr');
            previewRow.innerHTML = `
                <td>${name}</td>
                <td class="text-right">$${price.toFixed(2)}</td>
            `;
            previewItemList.appendChild(previewRow);
        });

        // Update Total
        previewTotal.textContent = `$${total.toFixed(2)}`;
    }

    /**
     * Handles downloading the receipt preview as a PNG image.
     */
    function downloadReceipt() {
        // Use html2canvas to capture the #receipt-preview div
        html2canvas(receiptPreview, {
            scale: 2, // Higher scale for better resolution
            useCORS: true, // If you were using external images
            backgroundColor: '#ffffff' // Ensure background is white
        }).then(canvas => {
            // Create a link element
            const link = document.createElement('a');
            
            // Set the download attribute with a filename
            const sellerName = document.getElementById('seller-name').value.replace(/ /g, '_') || 'receipt';
            const date = new Date().toISOString().split('T')[0];
            link.download = `ReceiptGenie_${sellerName}_${date}.png`;
            
            // Set the href to the canvas's data URL
            link.href = canvas.toDataURL('image/png');
            
            // Append the link to the body (required for Firefox)
            document.body.appendChild(link);
            
            // Programmatically click the link to trigger the download
            link.click();
            
            // Remove the link from the body
            document.body.removeChild(link);
        }).catch(err => {
            console.error('Oops, something went wrong!', err);
            alert('Error generating receipt image. Please try again.');
        });
    }
});