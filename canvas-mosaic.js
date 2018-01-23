const OPTS = {
    TILE_COLUMNS: 50,
    TILE_ALPHA: 1,
    COMPOSITE_OPERATION: 'soft-light',
    HOVER_SIZE: 200,
    IS_PIXELATED: true
};

const gui = new dat.GUI();
gui.add(OPTS, 'TILE_COLUMNS', 2, 200, 1).onFinishChange(render);
gui.add(OPTS, 'TILE_ALPHA', 0, 1, 0.01).onFinishChange(render);
gui.add(OPTS, 'IS_PIXELATED').onFinishChange(render);
gui.add(OPTS, 'HOVER_SIZE', 30, 400, 10);
gui.add(OPTS, 'COMPOSITE_OPERATION', [
    'source-over',
    'source-in',
    'source-out',
    'source-atop',
    'destination-over',
    'destination-in',
    'destination-out',
    'destination-atop',
    'lighter',
    'copy',
    'xor',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity'
]).onFinishChange(render);

const output = document.querySelector('.output');
const ctx = output.getContext('2d');
const loader = document.querySelector('.loader');

// TODO: this should be based off viewport dimensions
const MAX_WIDTH = Math.min(1000, window.innerWidth);
const GENERATED_IMAGE = new Image();
let TILE_WIDTH = Math.ceil(MAX_WIDTH / OPTS.TILE_COLUMNS);
let IMAGE_ASPECT_RATIO;
let SAMPLES;
let GENERATED_IMAGE_SAMPLES;

function number2hex (number) {
    const hex = number.toString(16);
    return (hex.length === 1 ? '0' : '') + hex;
}

function getTileColors (image, size) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size * image.height / image.width;
    context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

    const data = Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data);
    let colors = [];
    for (let i = 0; i < data.length; i += 4) {
        // #RRGGBB
        // colors[i / 4] = '#' + [data[i], data[i + 1], data[i + 2]].map(number2hex).join('');
        // rgba()
        // colors[i / 4] = `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${OPTS.TILE_ALPHA})`;
        colors[i / 4] = `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, 1)`;
    }
    return colors;
}

function render () {
    loader.style.display = 'block';
    output.style.display = 'none';
    GENERATED_IMAGE_SAMPLES = [];
    const TILE_COLUMNS = OPTS.TILE_COLUMNS;
    const TILE_COLUMNS_Y = OPTS.TILE_COLUMNS_Y = Math.floor(TILE_COLUMNS * IMAGE_ASPECT_RATIO);
    TILE_WIDTH = Math.ceil(MAX_WIDTH / TILE_COLUMNS);

    ctx.clearRect(0, 0, output.width, output.height);
    if (!OPTS.IS_PIXELATED) {
        ctx.drawImage(input, 0, 0, output.width, output.height);
    }

    var colors = getTileColors(input, TILE_COLUMNS);

    setTimeout(function () {
        for (var i = 0; i < TILE_COLUMNS; i++) {
            for (var j = 0; j < TILE_COLUMNS_Y; j++) {
                requestAnimationFrame(function (i, j) {
                    return () => {
                        const x = i * TILE_WIDTH;
                        const y = j * TILE_WIDTH;

                        if (OPTS.IS_PIXELATED) {
                            // Plain color
                            const color = colors[i + j * TILE_COLUMNS];
                            ctx.fillStyle = color;
                            ctx.fillRect(x, y, TILE_WIDTH, TILE_WIDTH);
                        }

                        // Images
                        ctx.globalAlpha = OPTS.TILE_ALPHA;
                        ctx.globalCompositeOperation = OPTS.COMPOSITE_OPERATION;

                        const randomSample = SAMPLES[Math.floor(SAMPLES.length * Math.random())];
                        GENERATED_IMAGE_SAMPLES[i + j * TILE_COLUMNS] = randomSample;

                        ctx.drawImage(randomSample, x, y, TILE_WIDTH, TILE_WIDTH);

                        ctx.globalCompositeOperation = 'source-over';
                        ctx.globalAlpha = 1;

                        if (i === TILE_COLUMNS - 1 && j === TILE_COLUMNS_Y - 1) {
                            loader.style.display = 'none';
                            output.style.display = 'block';

                            GENERATED_IMAGE.src = output.toDataURL();
                        }
                    };
                }(i, j));
            }
        }
    }, 4);
}

function Asset(url) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(img);
        img.src = url;
    });
}

const input = new Image();
input.onload = () => {
    IMAGE_ASPECT_RATIO = input.height / input.width;
    output.width = output.style.width = MAX_WIDTH;
    // output.height = output.style.height = MAX_WIDTH * IMAGE_ASPECT_RATIO;
    output.height = output.style.height = Math.floor(OPTS.TILE_COLUMNS * IMAGE_ASPECT_RATIO) * TILE_WIDTH;

    // render();
    Promise.all([
        'images/samples/1.jpg',
        'images/samples/2.jpg',
        'images/samples/3.jpg',
        'images/samples/4.jpg',
        'images/samples/5.jpg',
        'images/samples/6.jpg',
        'images/samples/7.jpg',
        'images/samples/8.jpg',
        'images/samples/9.jpg',
        'images/samples/10.jpg',
        'images/samples/11.jpg',
        'images/samples/12.jpg',
        'images/samples/13.jpg'
    ].map(Asset)).then(function (images) {
        console.log('all images loaded');
        SAMPLES = images;
        render();

        output.addEventListener('mousemove', function (e) {
            const x = Math.floor(e.offsetX / TILE_WIDTH) * TILE_WIDTH;
            const y = Math.floor(e.offsetY / TILE_WIDTH) * TILE_WIDTH;
            requestAnimationFrame(() => {
                reset();
                // ctx.fillStyle = 'rgba(0,255,0,1)';
                // ctx.fillRect(x * TILE_WIDTH, y * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);

                const img = GENERATED_IMAGE_SAMPLES[x / TILE_WIDTH + y / TILE_WIDTH * OPTS.TILE_COLUMNS];
                if (!img) {
                    return;
                }
                const ratio = OPTS.HOVER_SIZE / TILE_WIDTH;
                let diffY = diff = (1 - ratio) * TILE_WIDTH / 2;
                
                if (x + diff + TILE_WIDTH * ratio > output.width) {
                    diff = output.width - TILE_WIDTH * ratio - x;
                }
                
                if (x + diff < 0) {
                    diff = - x;
                }
                
                if (y + diff + TILE_WIDTH * ratio > output.height) {
                    diffY = output.height - TILE_WIDTH * ratio - y;
                }
                
                if (y + diffY < 0) {
                    diffY = - y;
                }

                ctx.drawImage(img, x + diff, y + diffY, TILE_WIDTH * ratio, TILE_WIDTH * ratio);
            });
        }, false);
    });
};
input.src = 'images/original.png';


// Mouse over functionality
function reset() {
    ctx.clearRect(0, 0, output.width, output.height);
    ctx.drawImage(GENERATED_IMAGE, 0, 0);
}
