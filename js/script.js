//image to pdf

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('jpg-to-pdf-input');
    const convertBtn = document.getElementById('jpg-to-pdf-convert');
    const resultContainer = document.getElementById('jpg-to-pdf-result');
    const resultName = document.getElementById('jpg-to-pdf-result-name');
    const downloadBtn = document.getElementById('jpg-to-pdf-download');
    let files = [];

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        files = Array.from(event.target.files);
        if (files.length > 0) {
            document.getElementById('jpg-to-pdf-info').innerText = `${files.length} file(s) selected`;
        }
    });

    // Handle drag and drop
    const dropArea = document.getElementById('jpg-to-pdf-drop');
    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('active');
    });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('active'));
    dropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        dropArea.classList.remove('active');
        files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            document.getElementById('jpg-to-pdf-info').innerText = `${files.length} file(s) selected`;
        }
    });

    // Convert to PDF
    convertBtn.addEventListener('click', async () => {
        if (files.length === 0) {
            alert('Please select at least one image file.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        for (let i = 0; i < files.length; i++) {
            const img = await loadImage(files[i]);
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (img.height * imgWidth) / img.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(img, 'JPEG', 0, 0, imgWidth, imgHeight);
        }

        // Set file name
        const fileName = document.getElementById('pdf-filename').value || 'converted_document';
        const pdfFileName = `${fileName}.pdf`;
        resultName.textContent = pdfFileName;
        resultContainer.style.display = 'block';

        // Download action
        downloadBtn.onclick = () => {
            pdf.save(pdfFileName);
        };
    });

    // Load image file and return promise
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = event.target.result;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }
});


//pdf to image
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pdf-to-jpg-input');
    const convertBtn = document.getElementById('pdf-to-jpg-convert');
    const resultContainer = document.getElementById('pdf-to-jpg-result');
    const resultItems = document.getElementById('pdf-to-jpg-items');
    const downloadAllBtn = document.getElementById('pdf-to-jpg-download-all');
    const qualityInput = document.getElementById('jpg-quality');
    const qualityValue = document.getElementById('jpg-quality-value');

    let pdfFile = null;
    let images = [];

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        pdfFile = event.target.files[0];
        if (pdfFile) {
            document.getElementById('pdf-to-jpg-info').innerText = pdfFile.name;
        }
    });

    // Update quality value display
    qualityInput.addEventListener('input', () => {
        qualityValue.textContent = `${qualityInput.value}%`;
    });

    // Convert PDF to JPG
    convertBtn.addEventListener('click', async () => {
        if (!pdfFile) {
            alert('Please select a PDF file.');
            return;
        }

        images = [];
        resultItems.innerHTML = '';

        const quality = qualityInput.value / 100;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target.result;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
                const imgUrl = await renderPageAsImage(pdf, i, quality);
                images.push(imgUrl);
                displayImageResult(imgUrl, `Page-${i}.jpg`);
            }

            if (images.length > 0) {
                resultContainer.style.display = 'block';
            }
        };
        reader.readAsArrayBuffer(pdfFile);
    });

    // Render PDF page to image
    async function renderPageAsImage(pdf, pageNumber, quality) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        return canvas.toDataURL('image/jpeg', quality);
    }

    // Display extracted image
    function displayImageResult(imageUrl, name) {
        const item = document.createElement('div');
        item.classList.add('result-item');
        item.innerHTML = `
            <img src="${imageUrl}" alt="${name}" style="width: 100px; height: auto;">
            <div class="result-info">
                <strong>${name}</strong>
                <button class="btn download-btn">Download</button>
            </div>
        `;
        item.querySelector('.download-btn').addEventListener('click', () => {
            downloadImage(imageUrl, name);
        });
        resultItems.appendChild(item);
    }

    // Download individual image
    function downloadImage(dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.click();
    }

    // Download all as ZIP
    downloadAllBtn.addEventListener('click', async () => {
        if (images.length === 0) return;

        const zip = new JSZip();
        images.forEach((img, i) => {
            zip.file(`Page-${i + 1}.jpg`, img.split(',')[1], { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'extracted_images.zip';
        link.click();
    });
});


//compress pdf
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('compress-file-input');
    const targetSizeInput = document.getElementById('target-size');
    const compressBtn = document.getElementById('compress-file-btn');
    const resultContainer = document.getElementById('compress-file-result');
    const resultName = document.getElementById('compress-file-result-name');
    const reductionDisplay = document.getElementById('compress-reduction');
    const downloadBtn = document.getElementById('compress-file-download');

    let file;
    let compressedDataUrl;

    // Handle file input
    fileInput.addEventListener('change', (event) => {
        file = event.target.files[0];
        if (file) {
            document.getElementById('compress-file-info').textContent = 
                `${file.name} (${formatFileSize(file.size)})`;
        }
    });

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Compress image
    async function compressImage(targetSizeKB) {
        try {
            const img = await loadImage(file);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Scale down to fit within reasonable bounds
            const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let quality = 0.9;
            let compressedData = canvas.toDataURL('image/webp', quality);

            // Adaptive quality reduction loop
            while (getBase64SizeInKB(compressedData) > targetSizeKB && quality > 0.1) {
                quality -= 0.05;
                compressedData = canvas.toDataURL('image/webp', quality);
            }

            compressedDataUrl = compressedData;
            updateResult(file.name, file.size, getBase64Size(compressedData));
        } catch (error) {
            console.error('Image compression failed:', error);
            alert('Failed to compress the file. Please try again.');
        }
    }

    // Load image into canvas
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function compressPDF(targetSizeKB) {
        try {
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
                const pdfData = new Uint8Array(event.target.result);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                const totalPages = pdf.numPages;
    
                const { jsPDF } = window.jspdf;
                const pdfDoc = new jsPDF();
    
                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1 });
    
                    // Create canvas and draw page
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
    
                    await page.render({ canvasContext: context, viewport }).promise;
    
                    // Compress canvas to reduce size
                    let quality = 0.9;
                    let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    
                    // Reduce quality until size matches target
                    while (getBase64SizeInKB(compressedDataUrl) > targetSizeKB / totalPages && quality > 0.1) {
                        quality -= 0.05;
                        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
    
                    if (i > 1) {
                        pdfDoc.addPage();
                    }
    
                    // Add compressed image to PDF
                    pdfDoc.addImage(compressedDataUrl, 'JPEG', 0, 0, pdfDoc.internal.pageSize.getWidth(), pdfDoc.internal.pageSize.getHeight());
                }
    
                // Save the final compressed PDF
                const compressedPdfBytes = pdfDoc.output('blob');
                compressedDataUrl = URL.createObjectURL(compressedPdfBytes);
                updateResult(file.name, file.size, compressedPdfBytes.size);
            };
    
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('PDF compression failed:', error);
            alert('Failed to compress the PDF. Please try again.');
        }
    }
    
    // Get base64 size in KB
    function getBase64SizeInKB(base64) {
        return (base64.length * 0.75) / 1024;
    }
    
    // Get base64 size in bytes
    function getBase64Size(base64) {
        const length = base64.length - 'data:image/webp;base64,'.length;
        return (length * 0.75);
    }

    
    // Update result section
    function updateResult(originalName, originalSize, compressedSize) {
        resultName.textContent = originalName.replace(/\.\w+$/, file.type.includes('pdf') ? '.pdf' : '.webp');
        const reduction = ((originalSize - compressedSize) / originalSize) * 100;
        reductionDisplay.textContent = Math.round(reduction);

        resultContainer.style.display = 'block';
        resultContainer.style.opacity = '1';
    }

    // Download compressed file
    downloadBtn.addEventListener('click', () => {
        if (compressedDataUrl) {
            const link = document.createElement('a');
            link.href = compressedDataUrl;
            link.download = file.name.replace(/\.\w+$/, file.type.includes('pdf') ? '.pdf' : '.webp');
            link.click();
        }
    });

    // Compress file on button click
    compressBtn.addEventListener('click', async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        const targetSizeKB = parseInt(targetSizeInput.value);
        if (isNaN(targetSizeKB) || targetSizeKB < 10 || targetSizeKB > 1000) {
            alert('Target size should be between 10 KB and 1000 KB.');
            return;
        }

        if (file.type.includes('image')) {
            await compressImage(targetSizeKB);
        } else if (file.type.includes('pdf')) {
            await compressPDF(targetSizeKB);
        } else {
            alert('Unsupported file type. Only images and PDFs are allowed.');
        }
    });
});


//image resizer

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resize-image-input');
    const previewContainer = document.getElementById('resize-image-preview-container');
    const canvas = document.getElementById('resize-image-preview');
    const ctx = canvas.getContext('2d');
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const resizeMethod = document.getElementById('resize-method');
    const percentInput = document.getElementById('resize-percent');
    const percentContainer = document.getElementById('resize-percent-container');
    const resizeBtn = document.getElementById('resize-image-btn');
    const downloadBtn = document.getElementById('resize-image-download');
    const resultContainer = document.getElementById('resize-image-result');
    const resultName = document.getElementById('resize-image-result-name');
    const newDimensions = document.getElementById('resize-new-dimensions');
    let originalImage = new Image();
    let originalWidth = 0;
    let originalHeight = 0;

    // Handle file input
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImage.onload = () => {
                    originalWidth = originalImage.width;
                    originalHeight = originalImage.height;

                    // Set initial dimensions
                    widthInput.value = originalWidth;
                    heightInput.value = originalHeight;

                    resizeCanvas(originalWidth, originalHeight);

                    previewContainer.classList.remove('hidden');
                };
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Resize canvas based on input
    function resizeCanvas(width, height) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(originalImage, 0, 0, width, height);
    }

    // Update preview in real-time
    widthInput.addEventListener('input', () => {
        if (resizeMethod.value === 'constrain') {
            const aspectRatio = originalWidth / originalHeight;
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
        resizeCanvas(Number(widthInput.value), Number(heightInput.value));
    });

    heightInput.addEventListener('input', () => {
        if (resizeMethod.value === 'constrain') {
            const aspectRatio = originalWidth / originalHeight;
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
        resizeCanvas(Number(widthInput.value), Number(heightInput.value));
    });

    // Handle percentage-based resizing
    percentInput.addEventListener('input', () => {
        if (resizeMethod.value === 'percent') {
            const scale = percentInput.value / 100;
            widthInput.value = Math.round(originalWidth * scale);
            heightInput.value = Math.round(originalHeight * scale);
            resizeCanvas(Number(widthInput.value), Number(heightInput.value));
        }
    });

    // Switch between resize modes
    resizeMethod.addEventListener('change', () => {
        if (resizeMethod.value === 'percent') {
            percentContainer.style.display = 'block';
            percentInput.value = 100;
        } else {
            percentContainer.style.display = 'none';
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
        }
        resizeCanvas(Number(widthInput.value), Number(heightInput.value));
    });

    // Resize action
    resizeBtn.addEventListener('click', () => {
        const width = Number(widthInput.value);
        const height = Number(heightInput.value);

        if (width > 0 && height > 0) {
            resizeCanvas(width, height);

            // Update result
            resultName.innerText = 'resized_image.jpg';
            newDimensions.innerText = `${width} × ${height}`;
            resultContainer.style.display = 'block';
        }
    });

    // Download resized image
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'resized_image.jpg';
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    });
});

//passport size photo
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('passport-photo-input');
    const canvas = document.getElementById('passport-photo-canvas');
    const ctx = canvas.getContext('2d');
    const sizeSelect = document.getElementById('passport-size');
    const nameInput = document.getElementById('passport-name');
    const dateInput = document.getElementById('passport-date');
    const textColorInput = document.getElementById('passport-text-color');
    const bgColorInput = document.getElementById('passport-bg-color');
    const customWidthInput = document.getElementById('custom-width');
    const customHeightInput = document.getElementById('custom-height');
    const customSizeInputs = document.getElementById('custom-size-inputs');
    const generateBtn = document.getElementById('passport-photo-generate');
    const downloadBtn = document.getElementById('passport-photo-download');
    const resultContainer = document.getElementById('passport-photo-result');
    const resultName = document.getElementById('passport-photo-result-name');
    const fileInfo = document.getElementById('passport-photo-info');
    const editor = document.getElementById('passport-photo-editor');

    let image = new Image();
    let width = 350;
    let height = 450;
    const footerHeight = 100;

    // Size mapping (in pixels)
    const sizeMap = {
        '35x45': [350, 450],
        '2x2': [600, 600],
        '33x48': [330, 480],
        '35x35': [350, 350],
    };

    // Handle file input
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileInfo.innerText = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                image.onload = () => {
                    editor.classList.remove('hidden');
                    updateCanvas();
                };
                image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle size change
    sizeSelect.addEventListener('change', () => {
        if (sizeSelect.value === 'custom') {
            customSizeInputs.classList.remove('hidden');
            validateCustomSize();
        } else {
            customSizeInputs.classList.add('hidden');
            [width, height] = sizeMap[sizeSelect.value];
            updateCanvas();
        }
    });

    // Handle custom size input
    customWidthInput.addEventListener('input', validateCustomSize);
    customHeightInput.addEventListener('input', validateCustomSize);

    function validateCustomSize() {
        const customWidth = parseInt(customWidthInput.value);
        const customHeight = parseInt(customHeightInput.value);

        if (!isNaN(customWidth) && !isNaN(customHeight) && customWidth > 0 && customHeight > 0) {
            width = customWidth;
            height = customHeight;
            updateCanvas();
        }
    }

    // Format date to DD/MM/YYYY
    function formatDate(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    function updateCanvas() {
        if (!image.src) return;
    
        const hasFooter = nameInput.value || dateInput.value;
    
        // Fixed canvas size (e.g., 350 x 450)
        canvas.width = width;
        canvas.height = height;
    
        // Scale image to maintain aspect ratio
        const scale = Math.min(width / image.width, height / image.height);
        const imgWidth = image.width * scale;
        const imgHeight = image.height * scale;
        const x = (width - imgWidth) / 2;
        const y = (height - imgHeight) / 2;
    
        // Dynamic footer height based on image size (10% of image height)
        const dynamicFooterHeight = hasFooter ? Math.round(height * 0.15) : 0;
    
        // Clear canvas before drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // Fill background color (removes unwanted borders)
        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Draw the image at full size (NO reduction for footer)
        ctx.drawImage(image, x, y, imgWidth, imgHeight);
    
        // Draw footer as overlay (if needed)
        if (hasFooter) {
            // Footer background (semi-transparent white)
            ctx.fillStyle = '#FFFFF';
            ctx.fillRect(0, height - dynamicFooterHeight, width, dynamicFooterHeight);
    
            // Footer text styling (bold + centered)
            ctx.fillStyle = textColorInput.value;
            ctx.font = `bold ${Math.round(dynamicFooterHeight * 0.35)}px Arial`;
            ctx.textAlign = 'center';
    
            // Name (if available)
            if (nameInput.value) {
                ctx.fillText(nameInput.value, width / 2, height - dynamicFooterHeight * 0.6);
            }
    
            // Date (if available)
            const formattedDate = formatDate(dateInput.value);
            if (formattedDate) {
                ctx.fillText(formattedDate, width / 2, height - dynamicFooterHeight * 0.2);
            }
        }
    }
        

    // Generate button action
    generateBtn.addEventListener('click', () => {
        if (!image.src) {
            alert('Please select an image first!');
            return;
        }
        updateCanvas();
        resultContainer.style.display = 'block';
        resultName.textContent = 'passport_photo.jpg';
    });

    // Download button action
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg');
        link.download = 'passport_photo.jpg';
        link.click();
    });
});


