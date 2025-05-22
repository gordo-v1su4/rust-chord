/**
 * WebGL/WebGPU video renderer module
 */

// Configuration
const config = {
    // Preferred rendering backend
    preferredBackend: 'webgl2', // 'webgl2', 'webgl', or 'webgpu'
    
    // WebGL settings
    webgl: {
        antialias: true,
        alpha: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default'
    },
    
    // Debug mode
    debug: false
};

// Shader sources for WebGL
const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    
    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }
`;

/**
 * Create a WebGL renderer
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} - The WebGL renderer
 */
function createWebGLRenderer(canvas) {
    // Try to get WebGL2 context, fall back to WebGL1
    let gl = canvas.getContext('webgl2', config.webgl);
    let version = 2;
    
    if (!gl) {
        gl = canvas.getContext('webgl', config.webgl);
        version = 1;
        
        if (!gl) {
            throw new Error('WebGL is not supported');
        }
    }
    
    if (config.debug) {
        console.log(`Using WebGL ${version}`);
    }
    
    // Compile shaders
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    
    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0
    ]), gl.STATIC_DRAW);
    
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ]), gl.STATIC_DRAW);
    
    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Set up rendering function
    const render = (frame) => {
        if (!frame) return;
        
        // Resize canvas if needed
        if (canvas.width !== frame.width || canvas.height !== frame.height) {
            canvas.width = frame.width;
            canvas.height = frame.height;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        
        // Upload frame data to texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            frame.width,
            frame.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            frame.imageData
        );
        
        // Use the program
        gl.useProgram(program);
        
        // Set up position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Set up texture coordinate attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Set texture uniform
        gl.uniform1i(textureLocation, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    
    // Clean up resources
    const cleanup = () => {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texCoordBuffer);
        gl.deleteTexture(texture);
    };
    
    return {
        render,
        cleanup,
        gl
    };
}

/**
 * Compile a WebGL shader
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {number} type - The shader type
 * @param {string} source - The shader source code
 * @returns {WebGLShader} - The compiled shader
 */
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    // Check for compilation errors
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Could not compile shader: ${info}`);
    }
    
    return shader;
}

/**
 * Create a WebGL program
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {WebGLShader} vertexShader - The vertex shader
 * @param {WebGLShader} fragmentShader - The fragment shader
 * @returns {WebGLProgram} - The created program
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    // Check for linking errors
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Could not link program: ${info}`);
    }
    
    return program;
}

/**
 * Create a 2D canvas renderer (fallback)
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} - The 2D canvas renderer
 */
function create2DRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('2D canvas is not supported');
    }
    
    if (config.debug) {
        console.log('Using 2D canvas renderer (fallback)');
    }
    
    // Set up rendering function
    const render = (frame) => {
        if (!frame) return;
        
        // Resize canvas if needed
        if (canvas.width !== frame.width || canvas.height !== frame.height) {
            canvas.width = frame.width;
            canvas.height = frame.height;
        }
        
        // Draw the frame to the canvas
        ctx.putImageData(frame.imageData, 0, 0);
    };
    
    // Clean up resources (nothing to clean up for 2D renderer)
    const cleanup = () => {};
    
    return {
        render,
        cleanup,
        ctx
    };
}

/**
 * Set up the video renderer
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} - The renderer object
 */
export function setupVideoRenderer(canvas) {
    if (!canvas) {
        throw new Error('Canvas element is required');
    }
    
    let renderer;
    
    try {
        // Try to create WebGL renderer
        renderer = createWebGLRenderer(canvas);
    } catch (error) {
        console.warn('WebGL renderer creation failed:', error);
        
        try {
            // Fall back to 2D canvas renderer
            renderer = create2DRenderer(canvas);
        } catch (fallbackError) {
            console.error('Fallback renderer creation failed:', fallbackError);
            throw new Error('No suitable renderer available');
        }
    }
    
    // Set up animation frame
    let animationFrameId = null;
    let lastFrame = null;
    
    // Start rendering loop
    const startRendering = () => {
        if (animationFrameId) return;
        
        const renderLoop = () => {
            // Render the last frame
            if (lastFrame) {
                renderer.render(lastFrame);
            }
            
            // Continue rendering loop
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        
        animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    // Stop rendering loop
    const stopRendering = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };
    
    // Render a specific frame
    const renderFrame = (frame) => {
        lastFrame = frame;
        
        // If not in continuous rendering mode, render immediately
        if (!animationFrameId) {
            renderer.render(frame);
        }
    };
    
    // Clean up resources
    const cleanup = () => {
        stopRendering();
        renderer.cleanup();
        lastFrame = null;
    };
    
    // Start rendering by default
    startRendering();
    
    // Return renderer interface
    return {
        renderFrame,
        startRendering,
        stopRendering,
        cleanup
    };
}

/**
 * Resize the renderer to maintain aspect ratio
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {number} videoWidth - The video width
 * @param {number} videoHeight - The video height
 */
export function resizeRendererWithAspectRatio(canvas, videoWidth, videoHeight) {
    if (!canvas || !videoWidth || !videoHeight) return;
    
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let width, height;
    
    if (containerAspect > videoAspect) {
        // Container is wider than video
        height = containerHeight;
        width = height * videoAspect;
    } else {
        // Container is taller than video
        width = containerWidth;
        height = width / videoAspect;
    }
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Center the canvas in its container
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
}

/**
 * Set renderer configuration
 * @param {Object} options - Configuration options
 */
export function setRendererConfig(options) {
    if (options.preferredBackend !== undefined) {
        config.preferredBackend = options.preferredBackend;
    }
    
    if (options.webgl !== undefined) {
        config.webgl = { ...config.webgl, ...options.webgl };
    }
    
    if (options.debug !== undefined) {
        config.debug = options.debug;
    }
}

/**
 * Get current renderer configuration
 * @returns {Object} - Current configuration
 */
export function getRendererConfig() {
    return { ...config };
}