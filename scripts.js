document.addEventListener('DOMContentLoaded', function () {
    const svgInput = document.getElementById('svg-input');
    const previewContainer = document.getElementById('preview-container');
    const previewPlaceholder = document.getElementById('preview-placeholder');
    const svgPreview = document.getElementById('svg-preview');
    const errorMessage = document.getElementById('error-message');
    const copyButton = document.getElementById('copy-button');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const colorInput = document.getElementById('color-input');
    const colorText = document.getElementById('color-text');


    // Advanced controls
    const vbMinX = document.getElementById('viewbox-minx');
    const vbMinY = document.getElementById('viewbox-miny');
    const vbWidth = document.getElementById('viewbox-width');
    const vbHeight = document.getElementById('viewbox-height');
    const backgroundInput = document.getElementById('background-input');
    const backgroundText = document.getElementById('background-text');
    const removePreviewBgBtn = document.getElementById('remove-preview-bg');
    const downloadButton = document.getElementById('download-button');
    const resetButton = document.getElementById('reset-button');
    const pasteButton = document.getElementById('paste-button');
    const inspector = document.getElementById('element-inspector');
    const ShowSvgBorderButton = document.getElementById('show-svg-border');

    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    let currentZoom = 1;

    // Theme controls
    const themeMap = [
        { var: '--primary', picker: 'accent-picker', text: 'accent-text' },
        { var: '--bg-deep', picker: 'bg-picker', text: 'bg-text' },
        { var: '--glass-surface', picker: 'card-picker', text: 'card-text' },
        { var: '--text-main', picker: 'text-picker', text: 'text-text' },
        { var: '--text-muted', picker: 'muted-picker', text: 'muted-text' },
        { var: '--glass-border', picker: 'border-picker', text: 'border-text' },
        { var: '--checker-dark', picker: 'checker-picker', text: 'checker-text' },
    ];
    const themeResetBtn = document.getElementById('theme-reset');

    let currentSvg = null;
    let editableElements = [];

    // Toast notification system
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = type === 'success'
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Default example SVG
    const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                        </svg>`;

    // svgInput.value = defaultSVG;
    // updatePreview(defaultSVG);
    svgPreview.style.display = 'none';
    svgInput.addEventListener('input', function () {
        updatePreview(this.value);
        addBorder();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + V when not in input - paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement == svgInput) {
            e.preventDefault();
            pasteButton?.click();
        }
        // Ctrl/Cmd + K - clear/reset
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            resetButton?.click();
        }
        // Ctrl/Cmd + C when preview is focused - copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !copyButton.disabled) {
            if (document.activeElement === previewContainer || previewContainer.contains(document.activeElement)) {
                e.preventDefault();
                copyButton?.click();
            }
        }
    });

    widthInput.addEventListener('input', () => applySize());
    heightInput.addEventListener('input', () => applySize());
    // SVG theme color (currentColor) - sync picker/text
    bindColorWithText(colorInput, colorText, () => applyThemeColor());

    // ViewBox + background
    ;[vbMinX, vbMinY, vbWidth, vbHeight].forEach(inp => inp.addEventListener('input', updateViewBox));
    // preview background supports hex via text field
    bindColorWithText(backgroundInput, backgroundText, (val) => {
        const color = val ?? backgroundInput.value;
        if (removePreviewBgBtn.checked) {
            removePreviewBgBtn.checked = false;
        }
        previewContainer.style.setProperty('--preview-bg-color', color);
    });

    removePreviewBgBtn.addEventListener('change', () => {
        if (removePreviewBgBtn.checked) {
            previewContainer.style.removeProperty('--preview-bg-color');
        } else {

            previewContainer.style.setProperty('--preview-bg-color', toHex(backgroundInput.value));
        }
    });

    copyButton.addEventListener('click', function () {
        const markup = getCurrentSvgMarkup();
        if (!markup) return;
        navigator.clipboard.writeText(markup)
            .then(() => {
                showToast('SVG copied to clipboard!', 'success');
                flashButton(copyButton, 'Copied!');
            })
            .catch(err => {
                showToast('Failed to copy SVG', 'error');
                console.error('Failed to copy: ', err);
            });
    });

    downloadButton.addEventListener('click', function () {
        const markup = getCurrentSvgMarkup();
        if (!markup) return;
        try {
            const blob = new Blob([markup], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graphic.svg';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('SVG downloaded successfully!', 'success');
        } catch (err) {
            showToast('Failed to download SVG', 'error');
            console.error('Failed to download: ', err);
        }
    });

    resetButton.addEventListener('click', () => {
        // Reset advanced controls
        vbMinX.value = '';
        vbMinY.value = '';
        vbWidth.value = '';
        vbHeight.value = '';
        widthInput.value = '';
        heightInput.value = '';
        svgInput.value = '';

        updatePreview('');
        updateStats();
        resetElementsInspector();
        showToast('Editor reset', 'success');

    });

    ShowSvgBorderButton.addEventListener('click', () => {
        addBorder();
    });

    function addBorder() {
        const svg = svgPreview.querySelector('svg');
        if (svg) {
            if (ShowSvgBorderButton.checked) {
                svg.classList.add('border');
            }
            else {
                svg.classList.remove('border');
            }
        }
    }

    if (pasteButton && navigator.clipboard?.readText) {
        pasteButton.addEventListener('click', async () => {
            try {
                const txt = await navigator.clipboard.readText();
                if (txt) {
                    svgInput.value = txt;
                    updatePreview(txt);
                    addBorder();
                    showToast('SVG pasted from clipboard!', 'success');
                } else {
                    showToast('Clipboard is empty', 'error');
                }
            } catch (e) {
                showToast('Clipboard access denied', 'error');
                console.warn('Clipboard read not allowed:', e);
            }
        });
    }

    // Initialize theme controls with current CSS vars
    themeMap.forEach(({ var: cssVar, picker, text }) => {
        const pickerEl = document.getElementById(picker);
        const textEl = document.getElementById(text);
        if (!pickerEl || !textEl) return;
        const initial = getCssVar(cssVar) || '#000000';
        const hex = toHex(initial) || '#000000';
        pickerEl.value = hex;
        textEl.value = hex;
        bindColorWithText(pickerEl, textEl, (val) => setCssVar(cssVar, val ?? pickerEl.value));
    });

    if (themeResetBtn) {
        themeResetBtn.addEventListener('click', () => {
            // Reset to defaults matching initial dark palette
            const defaults = {
                '--primary': '#a855f7',
                '--bg-deep': '#030014',
                '--glass-surface': 'rgba(15, 7, 40, 0.6)',
                '--text-main': '#ffffff',
                '--text-muted': '#94a3b8',
                '--glass-border': 'rgba(255, 255, 255, 0.08)',
                '--checker-dark': '#1e1b2e',
            };
            Object.entries(defaults).forEach(([k, v]) => setCssVar(k, v));
            // Re-init pickers
            themeMap.forEach(({ var: cssVar, picker, text }) => {
                const pickerEl = document.getElementById(picker);
                const textEl = document.getElementById(text);
                if (!pickerEl || !textEl) return;
                pickerEl.value = toHex(getCssVar(cssVar)) || pickerEl.value;
                textEl.value = pickerEl.value;
            });
            backgroundInput.value = '#030014';
            backgroundText.value = '';
            removePreviewBgBtn.checked = true;
            previewContainer.style.removeProperty('--preview-bg-color');
            showToast('Theme reset', 'success');
        });
    }

    // Zoom controls functionality
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 0.25, 3);
            applyZoom();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 0.25, 0.25);
            applyZoom();
        });
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            currentZoom = 1;
            applyZoom();
        });
    }

    function applyZoom() {
        if (svgPreview) {
            svgPreview.style.transform = `scale(${currentZoom})`;
            svgPreview.style.transition = 'transform 0.2s ease';
        }
        if (zoomLevelDisplay) {
            zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    }

    function updateStats(svgElement) {
        const statsDisplay = document.getElementById('preview-stats');
        if (!statsDisplay) return;

        if (!svgElement) {
            statsDisplay.style.display = 'none';
            return;
        } else {
            statsDisplay.style.display = 'block';
        }

        const paths = svgElement.querySelectorAll('path').length;
        const shapes = svgElement.querySelectorAll('rect, circle, ellipse, line, polyline, polygon').length;
        const total = paths + shapes;

        if (total > 0) {
            statsDisplay.style.display = 'block';
            statsDisplay.textContent = `${total} element${total !== 1 ? 's' : ''}`;
        } else {
            statsDisplay.textContent = '';
            statsDisplay.style.display = 'none';
        }
    }

    function updatePreview(svgCode) {
        errorMessage.style.display = 'none';
        previewPlaceholder.style.display = 'none';
        svgPreview.style.display = 'flex';
        svgPreview.innerHTML = '';

        if (!svgCode.trim()) {
            previewPlaceholder.style.display = 'flex';
            svgPreview.style.display = 'none';
            copyButton.disabled = true;
            downloadButton.disabled = true;
            resetElementsInspector();
            return;
        }

        try {
            // Create a temporary div to parse the SVG
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgCode.trim();

            // Find the SVG element
            const svgElement = tempDiv.querySelector('svg');

            if (!svgElement) {
                updateStats();
                resetElementsInspector();
                throw new Error('No SVG element found in the input');
            }

            // Clone the SVG to avoid modifying the original
            const clonedSvg = svgElement.cloneNode(true);
            currentSvg = clonedSvg;

            // Initialize ViewBox inputs from SVG
            initViewBoxInputs(clonedSvg);
            iniitateSizeInputs(svgElement);

            // Apply any size modifications
            applySizeAndColor(clonedSvg);

            // Build element inspector
            buildInspector(clonedSvg);

            // Update stats
            updateStats(clonedSvg);

            // Clear and append the new SVG
            svgPreview.innerHTML = '';
            svgPreview.appendChild(clonedSvg);

            copyButton.disabled = false;
            downloadButton.disabled = false;
        } catch (error) {
            showError(error.message);
            previewPlaceholder.style.display = 'flex';
            svgPreview.style.display = 'none';
            copyButton.disabled = true;
            downloadButton.disabled = true;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function applySizeAndColor(svgElement) {
        const width = widthInput.value;
        const height = heightInput.value;
        const color = colorInput.value;

        if (width) {
            svgElement.setAttribute('width', width);
        } else {
            svgElement.removeAttribute('width');
        }

        if (height) {
            svgElement.setAttribute('height', height);
        } else {
            svgElement.removeAttribute('height');
        }

        // Apply theme color to currentColor via CSS cascade
        if (color) {
            svgElement.style.color = color;
        } else {
            svgElement.style.removeProperty('color');
        }
    }

    function applySize() {
        if (!currentSvg) return;
        applySizeAndColor(currentSvg);
    }

    function applyThemeColor() {
        if (!currentSvg) return;
        applySizeAndColor(currentSvg);
    }

    function initViewBoxInputs(svgElement) {
        const vb = svgElement.getAttribute('viewBox');
        if (vb) {
            const parts = vb.trim().split(/\s+/).map(Number);
            vbMinX.value = isFinite(parts[0]) ? parts[0] : '';
            vbMinY.value = isFinite(parts[1]) ? parts[1] : '';
            vbWidth.value = isFinite(parts[2]) ? parts[2] : '';
            vbHeight.value = isFinite(parts[3]) ? parts[3] : '';
        } else {
            vbMinX.value = vbMinY.value = vbWidth.value = vbHeight.value = '';
        }
    }

    function iniitateSizeInputs(svgElement) {
        const w = svgElement.getAttribute('width');
        const h = svgElement.getAttribute('height');

        let initialWidth, initialHeight;
        const vb = svgElement.getAttribute('viewBox');
        if (vb) {
            const parts = vb.trim().split(/\s+/).map(Number);
            if (isFinite(parts[2])) initialWidth = parts[2];
            if (isFinite(parts[3])) initialHeight = parts[3];
        }
        if (w) {
            widthInput.value = w
        } else if (initialWidth) {
            widthInput.value = initialWidth
        } else {
            widthInput.value = 100
        };

        if (h) {
            heightInput.value = h
        } else if (initialHeight) {
            heightInput.value = initialHeight
        } else {
            heightInput.value = 100
        };
    }

    function updateViewBox() {
        if (!currentSvg) return;
        const vals = [vbMinX.value, vbMinY.value, vbWidth.value, vbHeight.value].map(v => v.trim());
        const allEmpty = vals.every(v => v === '');
        if (allEmpty) {
            currentSvg.removeAttribute('viewBox');
            return;
        }
        const nums = vals.map(v => (v === '' ? 0 : Number(v)));
        if (nums.some(n => !isFinite(n))) return;
        currentSvg.setAttribute('viewBox', nums.join(' '));
    }

    function resetElementsInspector() {
        inspector.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'small';
        empty.textContent = 'No editable elements found.';
        inspector.appendChild(empty);
        previewPlaceholder.style.display = 'flex';
        svgPreview.style.display = 'none';
    }

    function buildInspector(svgElement) {
        inspector.innerHTML = '';
        editableElements = Array.from(svgElement.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text,g'));
        if (editableElements.length === 0) {
            resetElementsInspector();
            return;
        }

        editableElements.forEach((el, idx) => {
            const row = document.createElement('div');
            row.className = 'inspector-row';

            const header = document.createElement('div');
            header.className = 'inspector-header';

            const labelContainer = document.createElement('div');
            labelContainer.className = 'inspector-label-container';

            const label = document.createElement('div');
            label.textContent = `#${idx + 1} <${el.tagName.toLowerCase()}${formatDescriptor(el)}> `;
            const mini = document.createElement('div');
            mini.className = 'small';
            mini.textContent = summarizeElement(el);

            labelContainer.appendChild(label);
            labelContainer.appendChild(mini);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-element-btn';
            deleteBtn.title = 'Delete element';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Delete this ${el.tagName.toLowerCase()} element?`)) {
                    el.remove();
                    buildInspector(currentSvg);
                    updateStats(currentSvg);
                    showToast('Element deleted', 'success');
                }
            });

            header.appendChild(labelContainer);
            header.appendChild(deleteBtn);
            row.appendChild(header);

            const controls = document.createElement('div');
            controls.className = 'inline-controls';

            // Fill section
            const fillGroup = document.createElement('div');
            fillGroup.className = 'control-group';

            const fillLabel = document.createElement('label');
            fillLabel.className = 'control-label';
            fillLabel.textContent = 'Fill';

            const fillWrapper = document.createElement('div');
            fillWrapper.className = 'control-input-group';

            const fillColor = document.createElement('input');
            fillColor.type = 'color';
            fillColor.className = 'color-picker-small';
            fillColor.value = safeColor(el.getAttribute('fill'));
            fillColor.title = 'Fill color';
            fillColor.dataset.idx = String(idx);

            const fillNoneLabel = document.createElement('label');
            fillNoneLabel.className = 'checkbox-label';
            const fillNoneCbx = document.createElement('input');
            fillNoneCbx.type = 'checkbox';
            fillNoneCbx.checked = (el.getAttribute('fill') || '').toLowerCase() === 'none';
            const fillNoneTxt = document.createElement('span');
            fillNoneTxt.textContent = 'None';
            fillNoneLabel.appendChild(fillNoneCbx);
            fillNoneLabel.appendChild(fillNoneTxt);

            fillColor.addEventListener('input', () => {
                const target = editableElements[idx];
                if (!target) return;
                target.setAttribute('fill', fillColor.value);
                fillNoneCbx.checked = false;
            });

            fillNoneCbx.addEventListener('change', () => {
                const target = editableElements[idx];
                if (!target) return;
                if (fillNoneCbx.checked) {
                    target.setAttribute('fill', 'none');
                } else {
                    target.removeAttribute('fill');
                }
            });

            fillWrapper.appendChild(fillColor);
            fillWrapper.appendChild(fillNoneLabel);
            fillGroup.appendChild(fillLabel);
            fillGroup.appendChild(fillWrapper);

            // Stroke section
            const strokeGroup = document.createElement('div');
            strokeGroup.className = 'control-group';

            const strokeLabel = document.createElement('label');
            strokeLabel.className = 'control-label';
            strokeLabel.textContent = 'Stroke';

            const strokeWrapper = document.createElement('div');
            strokeWrapper.className = 'control-input-group';

            const strokeColor = document.createElement('input');
            strokeColor.type = 'color';
            strokeColor.className = 'color-picker-small';
            strokeColor.value = safeColor(el.getAttribute('stroke'));
            strokeColor.title = 'Stroke color';
            strokeColor.dataset.idx = String(idx);

            const strokeNoneLabel = document.createElement('label');
            strokeNoneLabel.className = 'checkbox-label';
            const strokeNoneCbx = document.createElement('input');
            strokeNoneCbx.type = 'checkbox';
            strokeNoneCbx.checked = (el.getAttribute('stroke') || '').toLowerCase() === 'none';
            const strokeNoneTxt = document.createElement('span');
            strokeNoneTxt.textContent = 'None';
            strokeNoneLabel.appendChild(strokeNoneCbx);
            strokeNoneLabel.appendChild(strokeNoneTxt);

            strokeColor.addEventListener('input', () => {
                const target = editableElements[idx];
                if (!target) return;
                target.setAttribute('stroke', strokeColor.value);
                strokeNoneCbx.checked = false;
            });

            strokeNoneCbx.addEventListener('change', () => {
                const target = editableElements[idx];
                if (!target) return;
                if (strokeNoneCbx.checked) {
                    target.setAttribute('stroke', 'none');
                } else {
                    target.removeAttribute('stroke');
                }
            });

            strokeWrapper.appendChild(strokeColor);
            strokeWrapper.appendChild(strokeNoneLabel);
            strokeGroup.appendChild(strokeLabel);
            strokeGroup.appendChild(strokeWrapper);

            // Stroke width section
            const strokeWidthGroup = document.createElement('div');
            strokeWidthGroup.className = 'control-group';

            const strokeWidthLabel = document.createElement('label');
            strokeWidthLabel.className = 'control-label';
            strokeWidthLabel.textContent = 'Width';

            const strokeWidth = document.createElement('input');
            strokeWidth.type = 'number';
            strokeWidth.className = 'num-input-small';
            strokeWidth.placeholder = '1.5';
            strokeWidth.step = '0.5';
            strokeWidth.min = '0';
            const sw = el.getAttribute('stroke-width');
            strokeWidth.value = sw ? String(sw) : '';
            strokeWidth.addEventListener('input', () => {
                const target = editableElements[idx];
                if (!target) return;
                const val = strokeWidth.value.trim();
                if (val === '') {
                    target.removeAttribute('stroke-width');
                    if (target.hasAttribute('stroke')) {
                        target.removeAttribute('stroke');
                    }
                } else {
                    target.setAttribute('stroke-width', val);
                    if (!target.hasAttribute('stroke')) {
                        target.setAttribute('stroke', 'currentcolor');
                    }
                }
            });

            strokeWidthGroup.appendChild(strokeWidthLabel);
            strokeWidthGroup.appendChild(strokeWidth);

            // Opacity section
            const opacityGroup = document.createElement('div');
            opacityGroup.className = 'control-group';

            const opacityLabel = document.createElement('label');
            opacityLabel.className = 'control-label';
            opacityLabel.textContent = 'Opacity';

            const opacity = document.createElement('input');
            opacity.type = 'number';
            opacity.className = 'num-input-small';
            opacity.placeholder = '1.0';
            opacity.step = '0.1';
            opacity.min = '0';
            opacity.max = '1';
            const op = el.getAttribute('opacity');
            opacity.value = op ? String(op) : '';
            opacity.addEventListener('input', () => {
                const target = editableElements[idx];
                if (!target) return;
                const val = opacity.value.trim();
                if (val === '') {
                    target.removeAttribute('opacity');
                } else {
                    target.setAttribute('opacity', val);
                }
            });

            opacityGroup.appendChild(opacityLabel);
            opacityGroup.appendChild(opacity);

            // Append all groups to controls
            controls.appendChild(fillGroup);
            controls.appendChild(strokeGroup);
            controls.appendChild(strokeWidthGroup);
            controls.appendChild(opacityGroup);

            row.appendChild(controls);
            inspector.appendChild(row);
        });
    }

    function formatDescriptor(el) {
        const id = el.getAttribute('id');
        const cls = el.getAttribute('class');
        const bits = [];
        if (id) bits.push(`#${id}`);
        if (cls) bits.push(`.${cls.split(/\s+/).join('.')}`);
        return bits.length ? ' ' + bits.join('') : '';
    }

    function summarizeElement(el) {
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        return `fill: ${fill ?? 'inherit'} | stroke: ${stroke ?? 'inherit'}`;
    }

    function safeColor(val) {
        if (!val) return '#000000';
        const v = val.trim().toLowerCase();
        if (v === 'none' || v === 'currentcolor') return '#000000';
        // If it's already a hex color
        if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v;
        // Fallback
        return '#000000';
    }

    function getCurrentSvgMarkup() {
        if (!currentSvg) return null;
        // Serialize the current SVG (outerHTML keeps inline formatting)
        return currentSvg.outerHTML;
    }

    function flashButton(btn, text) {
        const originalText = btn.innerHTML;
        btn.textContent = text;
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1200);
    }

    // Utilities
    function bindColorWithText(pickerEl, textEl, onChange) {
        if (!pickerEl || !textEl) return;
        const apply = (val) => {
            const hex = toHex(val) || pickerEl.value;
            pickerEl.value = hex;
            textEl.value = hex;
            if (typeof onChange === 'function') onChange(hex);
        };
        pickerEl.addEventListener('input', () => apply(pickerEl.value));
        textEl.addEventListener('input', () => apply(textEl.value));
    }

    function setCssVar(name, value) {
        document.documentElement.style.setProperty(name, value);
        if (name === '--primary') {
            const darker = darkenHex(value, 0.12);
            document.documentElement.style.setProperty('--primary-hover', darker);
        }
    }

    function getCssVar(name) {
        const styles = getComputedStyle(document.documentElement);
        return styles.getPropertyValue(name).trim();
    }

    function toHex(val) {
        if (!val) return null;
        const v = val.toString().trim();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
        // rgb/rgba -> hex
        const m = v.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i);
        if (m) {
            const r = clamp255(parseInt(m[1], 10));
            const g = clamp255(parseInt(m[2], 10));
            const b = clamp255(parseInt(m[3], 10));
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }
        return null;
    }

    function clamp255(n) { return Math.max(0, Math.min(255, n)); }

    function darkenHex(hex, amount = 0.1) {
        const h = toHex(hex);
        if (!h) return hex;
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        const dr = Math.max(0, Math.min(255, Math.round(r * (1 - amount))));
        const dg = Math.max(0, Math.min(255, Math.round(g * (1 - amount))));
        const db = Math.max(0, Math.min(255, Math.round(b * (1 - amount))));
        return '#' + [dr, dg, db].map(x => x.toString(16).padStart(2, '0')).join('');
    }
});