// Version: 2025-09-05-13:39
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有输入元素
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

    // 定义参数参考范围
    const paramRanges = {
        riserHeight: { min: 15, max: 20, recommended: '16.5-18', unit: 'cm' },
        treadDepth: { min: 25, max: 30, recommended: '27-29', unit: 'cm' },
        blondelValue: { min: 590, max: 650, recommended: '610-640', unit: 'mm' },
        stairAngle: { min: 25, max: 35, recommended: '30-32', unit: '°' }
    };

    // 绑定Blondel类型选择事件
    blondelTypeSelect.addEventListener('change', function() {
        const blondelTypes = {
            standard: { riser: 17.5, tread: 28 },
            comfort: { riser: 17, tread: 29 },
            compact: { riser: 18, tread: 27 }
        };
        const selectedType = blondelTypes[this.value];
        riserHeightInput.value = selectedType.riser;
        treadDepthInput.value = selectedType.tread;
        calculateStairs();
    });

    // 监听所有输入元素的变化
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
        // 获取输入值并转换为毫米
        const totalHeight = (parseFloat(totalHeightInput.value) || 200) * 10;
        const riserHeight = (parseFloat(riserHeightInput.value) || 17.5) * 10;
        const treadDepth = (parseFloat(treadDepthInput.value) || 28) * 10;
        const totalDepth = (parseFloat(totalDepthInput.value) || 0) * 10;
        const treadThickness = (parseFloat(treadThicknessInput.value) || 0) * 10;
        const structureType = structureTypeSelect.value;



        /**
         * 楼梯结构类型说明：
         * 1. Standard结构（标准结构）：
         *    - 最高层借用楼台墙壁作为最高一层
         *    - 实际楼梯用料的层数比楼台高度少一层阶梯高度
         *    - 总深度 = 踏板深度 × (台阶数 - 1)
         * 
         * 2. Flush结构（平齐结构）：
         *    - 最高层踏板与楼台平面平齐
         *    - 实际楼梯用料比标准结构多一层
         *    - 总深度 = 踏板深度 × 台阶数（比标准结构多一个阶梯深度）
         */

        // 计算台阶数量（两种结构的高度等分相同）
        // 实际台阶数量 = 总高度 / 单层高度（向上取整）
        let numberOfSteps = Math.ceil(totalHeight / riserHeight);
        let actualRiserHeight = totalHeight / numberOfSteps;
        let actualTreadDepth = treadDepth;
        
        // 计算实际总深度（Flush结构比Standard结构多一个踏板深度）
        let actualTotalDepth;
        if (structureType === 'flush') {
            // Flush结构：最高层踏板与楼台平齐，总深度 = 踏板深度 × 台阶数
            actualTotalDepth = actualTreadDepth * numberOfSteps;
        } else {
            // Standard结构：最高层借用楼台墙壁，总深度 = 踏板深度 × (台阶数 - 1)
            actualTotalDepth = actualTreadDepth * (numberOfSteps - 1);
        }
        
        // 检查总深度限制
        if (totalDepth > 0 && actualTotalDepth > totalDepth) {
            // 需要重新调整台阶深度
            if (structureType === 'flush') {
                actualTreadDepth = totalDepth / numberOfSteps;
                actualTotalDepth = totalDepth;
            } else {
                actualTreadDepth = totalDepth / (numberOfSteps - 1);
                actualTotalDepth = totalDepth;
            }
            
            // 重新计算Blondel值，如果不合理则调整台阶数
            let newBlondelValue = 2 * actualRiserHeight + actualTreadDepth;
            if (newBlondelValue < 590 || newBlondelValue > 650) {
                // 调整台阶数量以满足Blondel公式
                const targetBlondel = 630; // 目标Blondel值
                numberOfSteps = Math.round(totalHeight / ((targetBlondel - actualTreadDepth) / 2));
                actualRiserHeight = totalHeight / numberOfSteps;
                
                // 重新计算总深度
                if (structureType === 'flush') {
                    actualTotalDepth = actualTreadDepth * numberOfSteps;
                } else {
                    actualTotalDepth = actualTreadDepth * (numberOfSteps - 1);
                }
            }
        }
        

        
        const stringerLength = Math.sqrt(Math.pow(totalHeight, 2) + Math.pow(actualTotalDepth, 2));
        const blondelValue = 2 * actualRiserHeight + actualTreadDepth;

        // 清空并绘制画布
        clearAndDrawStairs({
            numberOfSteps,
            riserHeight: actualRiserHeight,
            treadDepth: actualTreadDepth,
            totalHeight,
            totalDepth: actualTotalDepth,
            structureType
        });

        // 显示计算结果
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
        // 设置画布尺寸和缩放比例 - 最大化利用空间
    const maxWidth = 800;
    const maxHeight = 580; // 减少画布高度以减少上方空间
    const padding = 10; // 进一步减少边距
    
    // 设置画布尺寸
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算缩放比例 - 最大化占满画布
    // 为了保持左侧楼台墙体不变，我们使用固定的最大深度来计算缩放比例
    // 这个最大深度是Flush结构的深度（比Standard结构多一个踏板深度）
    const maxPossibleDepth = params.treadDepth * Math.ceil(params.totalHeight / params.riserHeight);
    const availableWidth = maxWidth - padding * 2;
    const availableHeight = maxHeight - padding * 2;
    const scaleX = availableWidth / (maxPossibleDepth + 90); // 包含墙壁宽度
    const scaleY = availableHeight / params.totalHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95; // 使用95%空间，留少量边距

        // 获取结构类型和踏板厚度
        const structureType = structureTypeSelect.value;
        const treadThickness = parseFloat(treadThicknessInput.value) || 0;

        // 绘制左侧墙壁 - 宽度增加2倍，高度根据结构类型调整
        const wallWidth = 90; // 墙壁宽度增加2倍（从30到90）
        
        // 楼台高度始终等于总高度输入
        let wallHeight = params.totalHeight * scale;
        
        ctx.beginPath();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(padding - wallWidth, canvas.height - padding - wallHeight, 
                    wallWidth, wallHeight);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(padding - wallWidth, canvas.height - padding - wallHeight, 
                      wallWidth, wallHeight);

        // 绘制地面
        ctx.beginPath();
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(padding - wallWidth, canvas.height - padding, 
                    params.totalDepth * scale + wallWidth + 50, padding);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(padding - wallWidth, canvas.height - padding, 
                      params.totalDepth * scale + wallWidth + 50, padding);

        // 绘制楼梯（统一颜色）
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#2196F3';

        // 计算楼梯起始位置
        let stairStartY;
        if (params.structureType === 'flush') {
            // Flush结构：最高层踏板与楼台平齐，整体上移一层
            stairStartY = canvas.height - padding - params.totalHeight * scale - params.riserHeight * scale;
        } else {
            // Standard结构：最高层借用楼台墙壁
            stairStartY = canvas.height - padding - params.totalHeight * scale;
        }
        
        // 绘制每一级台阶
        for (let i = 0; i < params.numberOfSteps; i++) {
            const x1 = padding + i * params.treadDepth * scale;
            const y1 = stairStartY + i * params.riserHeight * scale;
            const x2 = padding + i * params.treadDepth * scale;
            const y2 = stairStartY + (i + 1) * params.riserHeight * scale;
            const x3 = padding + (i + 1) * params.treadDepth * scale;
            const y3 = stairStartY + (i + 1) * params.riserHeight * scale;

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
                const lastX = padding + (i + 1) * params.treadDepth * scale;
                const lastY1 = stairStartY + (i + 1) * params.riserHeight * scale; // 从当前踏板平面开始
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
                    const flushY = canvas.height - padding - params.totalHeight * scale;
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
                const lastX1 = padding + i * params.treadDepth * scale;
                const lastX2 = padding + (i + 1) * params.treadDepth * scale;
                const lastY = stairStartY + (i + 1) * params.riserHeight * scale;
                
                ctx.beginPath();
                ctx.moveTo(lastX1, lastY);
                ctx.lineTo(lastX2, lastY);
                ctx.stroke();
                
                // 踏板厚度
                if (treadThickness > 0) {
                    ctx.fillStyle = '#1976D2';
                    ctx.fillRect(lastX1, lastY, (lastX2 - lastX1), treadThickness * scale);
                    ctx.strokeRect(lastX1, lastY, (lastX2 - lastX1), treadThickness * scale);
                    ctx.fillStyle = '#2196F3';
                }
            }
            
            // 踏板厚度（标准结构下跳过最后一个踏板）
            if (treadThickness > 0 && !(params.structureType === 'standard' && i === params.numberOfSteps - 1)) {
                ctx.fillStyle = '#1976D2';
                ctx.fillRect(x2, y2, (x3 - x2), treadThickness * scale);
                ctx.strokeRect(x2, y2, (x3 - x2), treadThickness * scale);
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
                    ctx.fillRect(padding, y2, (x2 - padding), treadThickness * scale);
                    ctx.strokeRect(padding, y2, (x2 - padding), treadThickness * scale);
                    ctx.fillStyle = '#2196F3';
                }
            }
            
            // 不再绘制与地面的连接踏板（底部）
            // 根据用户要求，移除了这部分踏板

            // 在中间台阶添加标注
            // 选择中间位置的台阶添加标注
            if (i === Math.floor(params.numberOfSteps / 2)) {
                    // 标注框（灰色边框）
                    const boxWidth = 120;
                    const boxHeight = 60;
                    const boxX = x3 + 20;
                    const boxY = y1 - 35;
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                    
                    // 绘制文字
                    ctx.fillStyle = '#2196F3';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`台阶: ${params.numberOfSteps}级`, boxX + 10, boxY + 20);
                    ctx.fillText(`高度: ${(params.riserHeight/10).toFixed(1)}cm`, boxX + 10, boxY + 35);
                    ctx.fillText(`深度: ${(params.treadDepth/10).toFixed(1)}cm`, boxX + 10, boxY + 50);
                    
                    // 添加箭头指示（灰色，与总高度箭头样式一致）
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.fillStyle = '#666';
                    
                    // 高度箭头（从左边框中间射向楼梯层高中点）
                    const heightMidY = (y1 + y2) / 2;
                    const boxLeftMidY = boxY + boxHeight / 2;
                    
                    // 绘制箭头线
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

                    // 深度箭头（从下边框中点射向楼梯梯面中点）
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
                
                    // 重新设置楼梯颜色，避免被标注颜色影响
                    ctx.strokeStyle = '#2196F3';
                    ctx.lineWidth = 2;
                    ctx.fillStyle = '#2196F3';
                
                ctx.setLineDash([]);
                }
        
        }


        // 添加尺寸标注
        addDimensions(params, scale, padding);
    }

    function addDimensions(params, scale, padding) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#2196F3';
        ctx.textAlign = 'center';

        /**
         * 总高度标注
         * - 箭头始终指向楼台高度（与总高度输入一致）
         * - 不论是Standard结构还是Flush结构，楼台高度都等于用户输入的总高度
         * - 箭头从地面指向楼台上平面
         */
        let heightArrowEndY = canvas.height - padding - params.totalHeight * scale;
        
        ctx.beginPath();
        ctx.moveTo(padding + 15, canvas.height - padding);
        ctx.lineTo(padding + 15, heightArrowEndY);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制箭头
        drawArrow(ctx, padding + 15, canvas.height - padding, padding + 15, heightArrowEndY);
        
        // 总高度文字（横向显示，移到箭头右侧）- 始终显示用户输入的总高度值
        let displayHeight = params.totalHeight / 10;
        ctx.fillText(`总高度: ${displayHeight.toFixed(1)}cm`, padding + 80, (canvas.height - padding + heightArrowEndY) / 2);

        // 总深度标注 - 调整位置使其可见
        const totalDepth = params.totalDepth; // 使用传入的实际总深度
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding - 10);
        ctx.lineTo(padding + totalDepth * scale, canvas.height - padding - 10);
        ctx.stroke();
        
        // 绘制箭头
        drawArrow(ctx, padding, canvas.height - padding - 10, padding + totalDepth * scale, canvas.height - padding - 10);
        
        // 总深度文字
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`总深度: ${(totalDepth/10).toFixed(1)}cm`, padding + totalDepth * scale / 2, canvas.height - padding - 25);
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
        // 计算楼梯角度
        const stairAngle = Math.atan(results.actualRiserHeight / results.treadDepth) * (180 / Math.PI);
        const structureType = structureTypeSelect.value;

        const totalDepthAdjusted = results.totalDepthAdjusted;

        // 计算实际踏面数
        const actualTreadCount = structureType === 'flush' ? results.numberOfSteps : results.numberOfSteps - 1;
        
        const resultItems = [
            { label: '台阶数量', value: `${results.numberOfSteps} 级`, range: `实际用到材料的踏面数:${actualTreadCount} 块(${structureType} 结构)` },
            { label: '单层高度', value: `${(results.actualRiserHeight/10).toFixed(1)} cm`, range: `不高于18cm，推荐 ${paramRanges.riserHeight.recommended}cm` },
            { label: '踏板深度', value: `${(results.treadDepth/10).toFixed(1)} cm`, range: `不低于26cm，推荐 ${paramRanges.treadDepth.recommended}cm` },
            { label: '总高度', value: `${(parseFloat(totalHeightInput.value) || 200).toFixed(1)} cm`, range: '用户输入的总高度' },
            { label: '总深度', value: `${(results.actualTotalDepth/10).toFixed(1)} cm${totalDepthAdjusted ? ' (已根据限制调整)' : ''}`, range: '根据台阶数计算，也受输入深度限制的限制' },
            { label: '斜梁长度', value: `${(results.stringerLength/10).toFixed(1)} cm`, range: '计算公式：√(总高度² + 总深度²)' },
            { label: '楼梯角度', value: `${stairAngle.toFixed(1)}°`, range: `正常不高于45°，推荐 ${paramRanges.stairAngle.recommended}°` }
        ];

        resultsDiv.innerHTML = resultItems.map(item => `
            <tr>
                <td>${item.label}</td>
                <td>${item.value}</td>
                <td>${item.range}</td>
            </tr>
        `).join('');

        // 显示校验结果
        const validations = [];

        // 确定楼梯类型
       // const blondelType = blondelTypeSelect.value;
       // const typeNames = { standard: '标准型', comfort: '舒适型', compact: '紧凑型' };
        //validations.push(`该楼梯为${typeNames[blondelType]}楼梯`);

        // 显示结构类型
        //const structureNames = { standard: 'Standard结构', flush: 'Flush结构' };
       // validations.push(`采用${structureNames[structureType]}`);

        // 检查Blondel值
        const blondelStatus = checkValueStatus(results.blondelValue, paramRanges.blondelValue);
        validations.push(`确保舒适型的Blondel值为 ${results.blondelValue.toFixed(0)}mm，${blondelStatus}`);

        // 检查楼梯角度
        const angleStatus = checkValueStatus(stairAngle, paramRanges.stairAngle);
        validations.push(`楼梯角度为 ${stairAngle.toFixed(1)}°，${angleStatus}`);

        // 显示总深度调整信息
        if (totalDepthAdjusted) {
            validations.push(`⚠ 总深度已根据限制进行调整`);
        }



        validationDiv.innerHTML = validations.map(text => 
            `<div class="validation-item">✓ ${text}</div>`
        ).join('');
    }

    function checkValueStatus(value, range) {
        if (value >= range.min && value <= range.max) {
            const [recMin, recMax] = range.recommended.split('-').map(Number);
            if (value >= recMin && value <= recMax) {
                return '在推荐范围内';
            }
            return '在可接受范围内';
        }
        return value < range.min ? '低于推荐范围' : '高于推荐范围';
    }

    // 初始计算
    calculateStairs();

    // 为示意图添加点击事件
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

// 生成图纸功能
function generateStaircase() {
    const canvas = document.getElementById('stairCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = '楼梯设计图.png';
    link.href = dataUrl;
    link.click();
}

// 图片弹窗功能
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

// 点击弹窗背景关闭弹窗
document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImageModal();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});