TowerDefense.graphics = function() {
    'use strict';

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    let canvasRelativeSize = 0.8;
    function resize() {
        canvas.style.width = (canvasRelativeSize * Math.min(window.innerWidth, window.innerHeight)).toString() + 'px';
        canvas.style.height = canvas.style.width;
    }

    resize();

    window.addEventListener('resize', resize);

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawTexture(spec) {
        ctx.save();

        ctx.translate(spec.center.x, spec.center.y);
        ctx.rotate(spec.rotation * Math.PI / 180);
        ctx.translate(-spec.center.x, -spec.center.y);

        ctx.drawImage(
            spec.image,
            spec.center.x - spec.size.width / 2,
            spec.center.y - spec.size.height / 2,
            spec.size.width, spec.size.height);

        ctx.restore();
    }

    function drawRectangle(spec) {
        ctx.save();

        ctx.globalAlpha = spec.alpha;
        ctx.lineWidth = spec.lineWidth;

        if (spec.fillStyle) {
            ctx.fillStyle = spec.fillStyle;
            ctx.fillRect(
                spec.position.x, spec.position.y,
                spec.width, spec.height
            );
        }

        if (spec.strokeStyle) {
            ctx.strokeStyle = spec.strokeStyle;
            ctx.strokeRect(
                spec.position.x, spec.position.y,
                spec.width, spec.height
            );
        }

        ctx.restore();
    }

    function drawCircle(spec) {
        ctx.save();

        ctx.beginPath();
        ctx.arc(spec.x, spec.y, spec.radius, 0, 2 * Math.PI);
        ctx.closePath();

        ctx.globalAlpha = spec.alpha;

        ctx.lineWidth = spec.lineWidth;

        if (spec.fillStyle) {
            ctx.fillStyle = spec.fillStyle;
            ctx.fill();
        }

        if (spec.strokeStyle) {
            ctx.strokeStyle = spec.strokeStyle;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPolygon(spec) {
        ctx.save();

        ctx.fillStyle = spec.fillStyle;
        ctx.strokeStyle = spec.strokeStyle;
        ctx.lineWidth = spec.lineWidth;

        ctx.translate(spec.center.x, spec.center.y);
        ctx.rotate(spec.rotation);
        ctx.translate(-spec.center.x, -spec.center.y);

        ctx.beginPath();
        ctx.moveTo(spec.points[0].x, spec.points[0].y);
        for (let i = 1; i < spec.points.length; ++i) {
            let point = spec.points[i];
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function drawText(spec) {
        ctx.save();

        ctx.font = spec.font;
        ctx.fillStyle = spec.fillStyle;
        ctx.strokeStyle = spec.strokeStyle;
        ctx.textBaseline = 'top';

        // Measure
        let width = ctx.measureText(spec.text).width;
        let height = ctx.measureText('m').width;

        ctx.translate(spec.position.x + width / 2, spec.position.y + height / 2);
        ctx.rotate(spec.rotation);
        ctx.translate(-(spec.position.x + width / 2), -(spec.position.y + height / 2));


        ctx.fillText(spec.text, spec.position.x, spec.position.y);
        ctx.strokeText(spec.text, spec.position.x, spec.position.y);

        ctx.restore();
    }

    function drawSubTexture(spec) {
        ctx.save();

        ctx.translate(spec.center.x, spec.center.y);
        ctx.rotate(spec.rotation);
        ctx.translate(-spec.center.x, -spec.center.y);

        // Pick the selected sprite from the sprite sheet to render
        ctx.drawImage(
            spec.image,
            spec.subTextureWidth * spec.xIdx, spec.subTextureHeight * spec.yIdx,      // Which sub-texture to pick out
            spec.subTextureWidth, spec.subTextureHeight,   // The size of the sub-texture
            spec.center.x - spec.size.width / 2,           // Where to draw the sub-texture
            spec.center.y - spec.size.height / 2,
            spec.size.width, spec.size.height);

        ctx.restore();
    }

    function measureTextWidth(font, text) {
        ctx.save();
        ctx.font = font;
        let width = ctx.measureText(text).width;
        ctx.restore();

        return width;
    }

    return {
        get canvas() { return canvas; },
        clear: clear,
        drawTexture: drawTexture,
        drawSubTexture: drawSubTexture,
        drawRectangle: drawRectangle,
        drawCircle: drawCircle,
        drawPolygon: drawPolygon,
        drawText: drawText,
        measureTextWidth: measureTextWidth
    };
}();