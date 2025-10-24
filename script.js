// Version: 2025-09-05-13:39
document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const totalHeightInput = document.getElementById('totalHeight');
    const riserHeightInput = document.getElementById('riserHeight');
    const treadDepthInput = document.getElementById('treadDepth');
    const totalDepthInput = document.getElementById('totalDepth');
    const treadThicknessInput = document.getElementById('treadThickness');
    const structureTypeSelect = document.getElementById('structureType');


    const blondelTypeSelect = document.getElementById('blondelType');
    const canvas = document.getElementById('stairCanvas');
    const ctx = canvas.getContext('2d');
    const resultsDiv = document.getElementById('results');
    const validationDiv = document.getElementById('validationResults');

    // Define parameter reference ranges (converted to inches)
    const paramRanges = {
        riserHeight: { min: 5.9, max: 7.9, recommended: '6.5-7.1', unit: '"' },
        treadDepth: { min: 9.8, max: 11.8, recommended: '10.6-11.4', unit: '"' },
        blondelValue: { min: 23.2, max: 25.6, recommended: '24.0-25.2', unit: '"' },
        stairAngle: { min: 25, max: 35, recommended: '30-32', unit: '°' }
    };

    // Bind Blondel type selection event
    blondelTypeSelect.addEventListener('change', function() {
        const blondelTypes = {
            standard: { riser: 6.9, tread: 11.0 },
            comfort: { riser: 6.7, tread: 11.4 },
            compact: { riser: 7.1, tread: 10.6 }
        };
        const selectedType = blondelTypes[this.value];
        riserHeightInput.value = selectedType.riser;
        treadDepthInput.value = selectedType.tread;
        calculateStairs();
    });

    // Listen to changes in all input elements
    const inputs = [totalHeightInput, riserHeightInput, treadDepthInput, totalDepthInput,
     treadThicknessInput, structureTypeSelect,
     blondelTypeSelect];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateStairs);
        } else {
            console.error('Element not found:', input);
        }
    });

    function calculateStairs() {
        // Get input values (now in inches, convert to internal units)
        const totalHeight = parseFloat(totalHeightInput.value) || 78.7;
        const riserHeight = parseFloat(riserHeightInput.value) || 6.9;
        const treadDepth = parseFloat(treadDepthInput.value) || 11.0;
        const totalDepth = parseFloat(totalDepthInput.value) || 0;
        const treadThickness = parseFloat(treadThicknessInput.value) || 0;
        const structureType = structureTypeSelect.value;



        /**
         * Stair structure type explanation:
         * 1. Standard Structure:
         *    - Top layer uses platform wall as the highest step
         *    - Actual stair material layers are one step less than platform height
         *    - Total depth = tread depth × (number of steps - 1)
         *
         * 2. Flush Structure:
         *    - Top tread is flush with platform surface
         *    - Actual stair material is one layer more than standard structure
         *    - Total depth = tread depth × number of steps (one tread depth more than standard structure)
         */

        // Calculate number of steps (height division is same for both structures)
        // Actual number of steps = total height / single step height (rounded up)
        let numberOfSteps = Math.ceil(totalHeight / riserHeight);
        let actualRiserHeight = totalHeight / numberOfSteps;
        let actualTreadDepth = treadDepth;
        
        // Calculate actual total depth (Flush structure has one more tread depth than Standard structure)
        let actualTotalDepth;
        if (structureType === 'flush') {
            // Flush structure: top tread is flush with platform, total depth = tread depth × number of steps
            actualTotalDepth = actualTreadDepth * numberOfSteps;
        } else {
            // Standard structure: top layer uses platform wall, total depth = tread depth × (number of steps - 1)
            actualTotalDepth = actualTreadDepth * (numberOfSteps - 1);
        }
        
        // Check total depth limitation
        if (totalDepth > 0 && actualTotalDepth > totalDepth) {
            // Need to readjust tread depth
            if (structureType === 'flush') {
                actualTreadDepth = totalDepth / numberOfSteps;
                actualTotalDepth = totalDepth;
            } else {
                actualTreadDepth = totalDepth / (numberOfSteps - 1);
                actualTotalDepth = totalDepth;
            }

            // Recalculate Blondel value, adjust step count if unreasonable
            let newBlondelValue = 2 * actualRiserHeight + actualTreadDepth;
            if (newBlondelValue < 23.2 || newBlondelValue > 25.6) {
                // Adjust number of steps to satisfy Blondel formula
                const targetBlondel = 24.8; // Target Blondel value (in inches)
                numberOfSteps = Math.round(totalHeight / ((targetBlondel - actualTreadDepth) / 2));
                actualRiserHeight = totalHeight / numberOfSteps;

                // Recalculate total depth
                if (structureType === 'flush') {
                    actualTotalDepth = actualTreadDepth * numberOfSteps;
                } else {
                    actualTotalDepth = actualTreadDepth * (numberOfSteps - 1);
                }
            }
        }
        

        
        const stringerLength = Math.sqrt(Math.pow(totalHeight, 2) + Math.pow(actualTotalDepth, 2));
        const blondelValue = 2 * actualRiserHeight + actualTreadDepth;

        // Clear canvas and draw stairs
        clearAndDrawStairs({
            numberOfSteps,
            riserHeight: actualRiserHeight,
            treadDepth: actualTreadDepth,
            totalHeight,
            totalDepth: actualTotalDepth,
            structureType
        });

        // Display calculation results
        displayResults({
            numberOfSteps,
            actualRiserHeight,
            treadDepth: actualTreadDepth,
            actualTotalDepth,
            stringerLength,
            blondelValue,
            totalDepthAdjusted: totalDepth > 0 && actualTotalDepth <= totalDepth
        });
    }

    function clearAndDrawStairs(params) {
        // Set canvas size and scaling ratio - maximize space utilization
    const maxWidth = 800;
    const maxHeight = 400; // 1:1 aspect ratio
    const padding = 10; // Reduce margins

    // Set canvas size
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling ratio - maximize canvas occupation (adjusting for inch units)
    // Convert inches to pixels with appropriate scaling factor for display
    const pixelsPerInch = 10; // Scale factor: 1 inch = 10 pixels for good visualization
    const maxPossibleDepth = params.treadDepth * Math.ceil(params.totalHeight / params.riserHeight);
    const availableWidth = maxWidth - padding * 2;
    const availableHeight = maxHeight - padding * 2;
    const scaleX = availableWidth / ((maxPossibleDepth + 9) * pixelsPerInch); // Include wall width (9 inches)
    const scaleY = availableHeight / (params.totalHeight * pixelsPerInch);
    const scale = Math.min(scaleX, scaleY) * 0.95; // Use 95% of space, leave small margins

        // Get structure type and tread thickness
        const structureType = structureTypeSelect.value;
        const treadThickness = parseFloat(treadThicknessInput.value) || 0;

        // Draw left wall - double width, height adjusted according to structure type
        const wallWidth = 9 * pixelsPerInch * scale; // Wall width 9 inches

        // Platform height always equals total height input
        let wallHeight = params.totalHeight * pixelsPerInch * scale;

        ctx.beginPath();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(padding - wallWidth, canvas.height - padding - wallHeight,
                    wallWidth, wallHeight);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(padding - wallWidth, canvas.height - padding - wallHeight,
                      wallWidth, wallHeight);

        // Draw ground
        ctx.beginPath();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(padding - wallWidth, canvas.height - padding,
                    params.totalDepth * pixelsPerInch * scale + wallWidth + 50, padding);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(padding - wallWidth, canvas.height - padding,
                      params.totalDepth * pixelsPerInch * scale + wallWidth + 50, padding);

        // Draw stairs (uniform color)
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#2196F3';

        // Calculate stair starting position
        let stairStartY;
        if (params.structureType === 'flush') {
            // Flush structure: top tread flush with platform, entire structure moves up one level
            stairStartY = canvas.height - padding - params.totalHeight * pixelsPerInch * scale - params.riserHeight * pixelsPerInch * scale;
        } else {
            // Standard structure: top layer uses platform wall
            stairStartY = canvas.height - padding - params.totalHeight * pixelsPerInch * scale;
        }

        // Draw each step
        for (let i = 0; i < params.numberOfSteps; i++) {
            const x1 = padding + i * params.treadDepth * pixelsPerInch * scale;
            const y1 = stairStartY + i * params.riserHeight * pixelsPerInch * scale;
            const x2 = padding + i * params.treadDepth * pixelsPerInch * scale;
            const y2 = stairStartY + (i + 1) * params.riserHeight * pixelsPerInch * scale;
            const x3 = padding + (i + 1) * params.treadDepth * pixelsPerInch * scale;
            const y3 = stairStartY + (i + 1) * params.riserHeight * pixelsPerInch * scale;

            /**
             * 绘制垂直线（踢板）规则：
             * 1. 与楼台墙面接触的垂直线（i = 0，最上层）
             *    - Standard结构：最高层借用楼台墙壁，需要绘制连接线
             *    - Flush结构：最高层踏板与楼台平齐，需要绘制连接线
             * 2. 与地面接触的垂直线（i = numberOfSteps - 1，最下层）
             *    - 两种结构都需要绘制与地面的连接线
             */
            let shouldDrawVertical = true;
            
            // 绘制垂直线（踢板），但不绘制最上面的一根
            if (i > 0) { // 跳过最上面的一根踢板
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            // Flush结构下，添加最右下角的踢板
            if (params.structureType === 'flush' && i === params.numberOfSteps - 1) {
                const lastX = padding + (i + 1) * params.treadDepth * pixelsPerInch * scale;
                const lastY1 = stairStartY + (i + 1) * params.riserHeight * pixelsPerInch * scale; // 从当前踏板平面开始
                const lastY2 = canvas.height - padding; // 延伸到地面

                ctx.beginPath();
                ctx.moveTo(lastX, lastY1);
                ctx.lineTo(lastX, lastY2);
                ctx.stroke();
            }
            
            // 不再绘制与楼台墙面的连接（顶部）蓝色线条
            // 根据用户要求，移除了这部分线条
            
            // 不再绘制与地面的连接（底部）长蓝线
            // 根据用户要求，移除了这部分线条

            /**
             * 绘制踏板规则：
             * 1. Standard结构：
             *    - 绘制最高层踏板（i = 0，与楼台墙壁连接）
             *    - 绘制最底层踏板（i = numberOfSteps - 1，与地面连接）
             * 2. Flush结构：
             *    - 绘制最高层踏板（i = 0，与楼台平齐）
             *    - 绘制最底层踏板（i = numberOfSteps - 1，与地面连接）
             */
            
            // 绘制所有踏板，包括与楼台墙面和地面的连接
            // 标准结构下，跳过最后一个踏板的绘制（最右下角）
            if (params.structureType === 'standard' && i === params.numberOfSteps - 1) {
                // 不绘制标准结构下最右下角的踏板
            } else {
                ctx.beginPath();
                
                // 特殊处理Flush结构的最高层踏板
                if (i === 0 && params.structureType === 'flush') {
                    // Flush结构：最高层踏板应与楼台平齐
                    const flushY = canvas.height - padding - params.totalHeight * pixelsPerInch * scale;
                    ctx.moveTo(x2, flushY); // 从楼台平面高度开始
                    ctx.lineTo(x3, flushY); // 保持在楼台平面高度
                } else {
                    // 标准绘制方式
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x3, y3);
                }
                ctx.stroke();
            }
            
            // Flush结构下，为最右下角添加完整的踏板
            if (params.structureType === 'flush' && i === params.numberOfSteps - 1) {
                const lastX1 = padding + i * params.treadDepth * pixelsPerInch * scale;
                const lastX2 = padding + (i + 1) * params.treadDepth * pixelsPerInch * scale;
                const lastY = stairStartY + (i + 1) * params.riserHeight * pixelsPerInch * scale;

                ctx.beginPath();
                ctx.moveTo(lastX1, lastY);
                ctx.lineTo(lastX2, lastY);
                ctx.stroke();

                // 踏板厚度
                if (treadThickness > 0) {
                    ctx.fillStyle = '#1976D2';
                    ctx.fillRect(lastX1, lastY, (lastX2 - lastX1), treadThickness * pixelsPerInch * scale);
                    ctx.strokeRect(lastX1, lastY, (lastX2 - lastX1), treadThickness * pixelsPerInch * scale);
                    ctx.fillStyle = '#2196F3';
                }
            }
            
            // 踏板厚度（标准结构下跳过最后一个踏板）
            if (treadThickness > 0 && !(params.structureType === 'standard' && i === params.numberOfSteps - 1)) {
                ctx.fillStyle = '#1976D2';
                ctx.fillRect(x2, y2, (x3 - x2), treadThickness * pixelsPerInch * scale);
                ctx.strokeRect(x2, y2, (x3 - x2), treadThickness * pixelsPerInch * scale);
                ctx.fillStyle = '#2196F3';
            }

            // 特殊处理与楼台墙面的连接踏板（顶部）
            if (i === 0) {
                // 绘制与楼台墙面的连接踏板
                ctx.beginPath();
                ctx.moveTo(padding, y2);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // 踏板厚度
                if (treadThickness > 0) {
                    ctx.fillStyle = '#1976D2';
                    ctx.fillRect(padding, y2, (x2 - padding), treadThickness * pixelsPerInch * scale);
                    ctx.strokeRect(padding, y2, (x2 - padding), treadThickness * pixelsPerInch * scale);
                    ctx.fillStyle = '#2196F3';
                }
            }
            
            // 不再绘制与地面的连接踏板（底部）
            // 根据用户要求，移除了这部分踏板

            // Add annotation to middle step
            // Select middle step for annotation
            if (i === Math.floor(params.numberOfSteps / 2)) {
                    // Annotation box (gray border)
                    const boxWidth = 120;
                    const boxHeight = 60;
                    const boxX = x3 + 20;
                    const boxY = y1 - 35;
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                    
                    // Draw text
                    ctx.fillStyle = '#2196F3';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Steps: ${params.numberOfSteps}`, boxX + 10, boxY + 20);
                    ctx.fillText(`Height: ${params.riserHeight.toFixed(1)}"`, boxX + 10, boxY + 35);
                    ctx.fillText(`Depth: ${params.treadDepth.toFixed(1)}"`, boxX + 10, boxY + 50);
                    
                    // Add arrow indicators (gray, consistent with total height arrow style)
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.fillStyle = '#666';
                    
                    // Height arrow (from middle of left border to midpoint of stair layer height)
                    const heightMidY = (y1 + y2) / 2;
                    const boxLeftMidY = boxY + boxHeight / 2;

                    // Draw arrow line
                    ctx.beginPath();
                    ctx.moveTo(boxX, boxLeftMidY);
                    ctx.lineTo(x2, heightMidY);
                    ctx.stroke();
                    
                    // 绘制箭头头部（与总高度箭头样式一致）
                    const headLength = 10;
                    const angle1 = Math.atan2(heightMidY - boxLeftMidY, x2 - boxX);
                    ctx.beginPath();
                    ctx.moveTo(x2, heightMidY);
                    ctx.lineTo(x2 - headLength * Math.cos(angle1 - Math.PI / 6), heightMidY - headLength * Math.sin(angle1 - Math.PI / 6));
                    ctx.moveTo(x2, heightMidY);
                    ctx.lineTo(x2 - headLength * Math.cos(angle1 + Math.PI / 6), heightMidY - headLength * Math.sin(angle1 + Math.PI / 6));
                    ctx.stroke();

                    // Depth arrow (from middle of bottom border to midpoint of stair tread)
                    const depthMidX = (x2 + x3) / 2;
                    const boxBottomMidX = boxX + boxWidth / 2;
                    
                    // 绘制箭头线
                    ctx.beginPath();
                    ctx.moveTo(boxBottomMidX, boxY + boxHeight);
                    ctx.lineTo(depthMidX, y3);
                    ctx.stroke();
                    
                    // 绘制箭头头部（与总高度箭头样式一致）
                    const angle2 = Math.atan2(y3 - (boxY + boxHeight), depthMidX - boxBottomMidX);
                    ctx.beginPath();
                    ctx.moveTo(depthMidX, y3);
                    ctx.lineTo(depthMidX - headLength * Math.cos(angle2 - Math.PI / 6), y3 - headLength * Math.sin(angle2 - Math.PI / 6));
                    ctx.moveTo(depthMidX, y3);
                    ctx.lineTo(depthMidX - headLength * Math.cos(angle2 + Math.PI / 6), y3 - headLength * Math.sin(angle2 + Math.PI / 6));
                    ctx.stroke();
                
                    // Reset stair color to avoid annotation color interference
                    ctx.strokeStyle = '#2196F3';
                    ctx.lineWidth = 2;
                    ctx.fillStyle = '#2196F3';
                
                ctx.setLineDash([]);
                }
        
        }


        // Add dimension annotations
        addDimensions(params, scale, padding, pixelsPerInch);
    }

    function addDimensions(params, scale, padding, pixelsPerInch) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#2196F3';
        ctx.textAlign = 'center';

        /**
         * Total height annotation
         * - Arrow always points to platform height (consistent with total height input)
         * - Whether Standard or Flush structure, platform height equals user-input total height
         * - Arrow points from ground to platform top surface
         */
        let heightArrowEndY = canvas.height - padding - params.totalHeight * pixelsPerInch * scale;
        
        ctx.beginPath();
        ctx.moveTo(padding + 15, canvas.height - padding);
        ctx.lineTo(padding + 15, heightArrowEndY);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制箭头
        drawArrow(ctx, padding + 15, canvas.height - padding, padding + 15, heightArrowEndY);
        
        // Total height text (horizontal display, moved to right of arrow) - always display user-input total height value
        let displayHeight = params.totalHeight;
        ctx.fillText(`Total Height: ${displayHeight.toFixed(1)}"`, padding + 80, (canvas.height - padding + heightArrowEndY) / 2);

        // Total depth annotation - adjust position to make it visible
        const totalDepth = params.totalDepth; // Use actual total depth passed in
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding - 10);
        ctx.lineTo(padding + totalDepth * pixelsPerInch * scale, canvas.height - padding - 10);
        ctx.stroke();

        // 绘制箭头
        drawArrow(ctx, padding, canvas.height - padding - 10, padding + totalDepth * pixelsPerInch * scale, canvas.height - padding - 10);

        // Total depth text
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Total Depth: ${totalDepth.toFixed(1)}"`, padding + totalDepth * pixelsPerInch * scale / 2, canvas.height - padding - 25);
    }

    function drawArrow(ctx, fromX, fromY, toX, toY) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // 绘制箭头头部
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    function displayResults(results) {
        // Calculate stair angle
        const stairAngle = Math.atan(results.actualRiserHeight / results.treadDepth) * (180 / Math.PI);
        const structureType = structureTypeSelect.value;

        const totalDepthAdjusted = results.totalDepthAdjusted;

        // Calculate actual tread count
        const actualTreadCount = structureType === 'flush' ? results.numberOfSteps : results.numberOfSteps - 1;

        const resultItems = [
            { label: 'Step Count', value: `${results.numberOfSteps}`, range: `Actual tread material count: ${actualTreadCount} pieces (${structureType} structure)` },
            { label: 'Riser Height', value: `${results.actualRiserHeight.toFixed(1)}"`, range: `Not higher than 7.9", recommended ${paramRanges.riserHeight.recommended}"` },
            { label: 'Tread Depth', value: `${results.treadDepth.toFixed(1)}"`, range: `Not less than 10.2", recommended ${paramRanges.treadDepth.recommended}"` },
            { label: 'Total Height', value: `${(parseFloat(totalHeightInput.value) || 78.7).toFixed(1)}"`, range: 'User input total height' },
            { label: 'Total Depth', value: `${results.actualTotalDepth.toFixed(1)}"${totalDepthAdjusted ? ' (adjusted for limitation)' : ''}`, range: 'Calculated by step count, also limited by input depth constraint' },
            { label: 'Stringer Length', value: `${results.stringerLength.toFixed(1)}"`, range: 'Formula: √(total height² + total depth²)' },
            { label: 'Stair Angle', value: `${stairAngle.toFixed(1)}°`, range: `Normally not higher than 45°, recommended ${paramRanges.stairAngle.recommended}°` }
        ];

        resultsDiv.innerHTML = resultItems.map(item => `
            <tr>
                <td>${item.label}</td>
                <td>${item.value}</td>
                <td>${item.range}</td>
            </tr>
        `).join('');

        // Display validation results
        const validations = [];

        // Determine stair type
       // const blondelType = blondelTypeSelect.value;
       // const typeNames = { standard: '标准型', comfort: '舒适型', compact: '紧凑型' };
        //validations.push(`该楼梯为${typeNames[blondelType]}楼梯`);

        // Display structure type
        //const structureNames = { standard: 'Standard结构', flush: 'Flush结构' };
       // validations.push(`采用${structureNames[structureType]}`);

        // Check Blondel value
        const blondelStatus = checkValueStatus(results.blondelValue, paramRanges.blondelValue);
        validations.push(`Comfort-oriented Blondel value is ${results.blondelValue.toFixed(0)}mm, ${blondelStatus}`);

        // Check stair angle
        const angleStatus = checkValueStatus(stairAngle, paramRanges.stairAngle);
        validations.push(`Stair angle is ${stairAngle.toFixed(1)}°, ${angleStatus}`);

        // Display total depth adjustment information
        if (totalDepthAdjusted) {
            validations.push(`⚠ Total depth has been adjusted according to limitations`);
        }



        validationDiv.innerHTML = validations.map(text =>
            `<div class="validation-item">✓ ${text}</div>`
        ).join('');
    }

    function checkValueStatus(value, range) {
        if (value >= range.min && value <= range.max) {
            const [recMin, recMax] = range.recommended.split('-').map(Number);
            if (value >= recMin && value <= recMax) {
                return 'Within recommended range';
            }
            return 'Within acceptable range';
        }
        return value < range.min ? 'Below recommended range' : 'Above recommended range';
    }

    // Language dropdown functionality
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const currentLangSpan = document.querySelector('.current-lang');
    const langOptions = document.querySelectorAll('.lang-option');
    const languageDropdown = document.querySelector('.language-dropdown');

    // Toggle dropdown
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        languageDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        languageDropdown.classList.remove('active');
    });

    // Handle language selection
    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Remove active class from all options
            langOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to selected option
            this.classList.add('active');

            // Update current language display
            currentLangSpan.textContent = this.textContent;

            // Close dropdown
            languageDropdown.classList.remove('active');

            // Here you can add actual language switching logic
            const selectedLang = this.getAttribute('data-lang');
            console.log('Language switched to:', selectedLang);
        });
    });

    // Initial calculation
    calculateStairs();

    // Add click event to schematic images
    document.querySelectorAll('.info-image').forEach(img => {
        img.addEventListener('click', function() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                cursor: pointer;
            `;

            const modalImg = document.createElement('img');
            modalImg.src = this.src;
            modalImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                background: white;
                padding: 10px;
                border-radius: 5px;
            `;

            modal.appendChild(modalImg);
            document.body.appendChild(modal);

            modal.addEventListener('click', () => {
                modal.remove();
            });
        });
    });
});

// Generate drawing function
function generateStaircase() {
    const canvas = document.getElementById('stairCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'stair_design.png';
    link.href = dataUrl;
    link.click();
}

// Image modal function
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modal.style.display = 'block';
    modalImage.src = imageSrc;
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

// Click modal background to close modal
document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImageModal();
    }
});

// ESC key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});