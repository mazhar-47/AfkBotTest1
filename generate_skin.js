const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple 64x64 skin (basic steve-like format)
const canvas = createCanvas(64, 64);
const ctx = canvas.getContext('2d');

// Set background color (skin base color)
ctx.fillStyle = '#c4ab7c';  // Light brown color
ctx.fillRect(0, 0, 64, 64);

// Add simple details (blue shirt, brown pants)
ctx.fillStyle = '#5c94fc';  // Blue for shirt
ctx.fillRect(20, 20, 28, 8); // Torso
ctx.fillStyle = '#8b5c39';  // Brown for pants
ctx.fillRect(20, 36, 28, 12); // Legs

// Save the skin
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./skins/default.png', buffer);
console.log('Default skin generated successfully!');
