function sector(ctx, cx, cy, alpha, delta, r, r2, fill) {
    alpha -= Math.PI / 2;
    var p1, p3, p4, alpha2 = alpha + delta;
    p1 = {
        x: cx + r * Math.cos(alpha),
        y: cy + r * Math.sin(alpha)
    };
    if (r2) {
        p3 = {
            x: cx + r2 * Math.cos(alpha),
            y: cy + r2 * Math.sin(alpha)
        };
        p4 = {
            x: cx + r2 * Math.cos(alpha2),
            y: cy + r2 * Math.sin(alpha2)
        };
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    if (r2) {
        ctx.moveTo(p3.x, p3.y);
    }
    ctx.lineTo(p1.x, p1.y);
    ctx.arc(cx, cy, r, alpha, alpha2, 0);
    if (r2) {
        ctx.lineTo(p4.x, p4.y);
        ctx.arc(cx, cy, r2, alpha2, alpha, 1);
    } else {
        ctx.closePath();
    }
    if (fill === false) {
        ctx.stroke();
    } else {
        ctx.fill();
    }
}