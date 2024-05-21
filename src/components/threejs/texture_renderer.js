import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

/**
 * TODO
 * This class renders the textures generated by offscreen renderers.
 * It can render the data:
 * - raw: from the uv data access the nearest texel from the input texture and render as is
 * - processed: TODO more control over the data
 * - specialized: TODO specific use cases tailored for the input data
 */
class TextureRenderer {

    constructor(renderer, simulationParameters, scene) {
        this.renderer = renderer;
        this.simulationParameters = simulationParameters;
        this.scene = scene;
    }

    initialize() {
        console.warn("INITIALIZE TextureRenderer");

        this.width = 100;
        this.height = 100;

        this.generateUniforms();
        this.textured_plane_geometry = new THREE.PlaneGeometry(1, 1);
        this.textured_plane_material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
        })
        this.textured_plane_mesh = new THREE.Mesh(this.textured_plane_geometry, this.textured_plane_material);
        this.scene.add(this.textured_plane_mesh);
    }

    updateTransform(pos_x, pos_y, scale_x, scale_y){
        this.textured_plane_mesh.scale.set(scale_x, scale_y, 1);
        this.textured_plane_mesh.position.set(pos_x, pos_y, 0);
    }

    changeDisplayedTexture(texture){
        this.displayedTexture = texture;
    }

    updateTexturedPlane() {
        this.setAdditionalUniforms();        
        this.textured_plane_mesh.material.uniforms.mu.value = this.simulationParameters.mu;
        this.textured_plane_mesh.material.uniforms.primary_x.value = this.simulationParameters.getPrimaryX();
        this.textured_plane_mesh.material.uniforms.secondary_x.value = this.simulationParameters.getSecondaryX();
        this.textured_plane_mesh.material.uniforms.primary_mass.value = this.simulationParameters.getPrimaryMass();
        this.textured_plane_mesh.material.uniforms.secondary_mass.value = this.simulationParameters.getSecondaryMass();
        this.textured_plane_mesh.material.uniforms.planeCornerBL.value.x = this.simulationParameters.domain_min_x;
        this.textured_plane_mesh.material.uniforms.planeCornerBL.value.y = this.simulationParameters.domain_min_y;
        this.textured_plane_mesh.material.uniforms.planeDimensions.value.x = this.simulationParameters.domain_dimension_x;
        this.textured_plane_mesh.material.uniforms.planeDimensions.value.y = this.simulationParameters.domain_dimension_y;
        this.textured_plane_mesh.material.uniforms.planeDimensionsPixel.value.x = this.simulationParameters.domain_pixels_x;
        this.textured_plane_mesh.material.uniforms.planeDimensionsPixel.value.y = this.simulationParameters.domain_pixels_y;
        return;
    }

    generateUniforms() {
        this.uniforms = {
            mu: { type: 'float', value: 0.1 },
            primary_x: { type: 'float', value: 0.0 },
            secondary_x: { type: 'float', value: 0.0 },
            primary_mass: { type: 'float', value: 0.0 },
            secondary_mass: { type: 'float', value: 0.0 },
            planeCenter: { type: 'vec2', value: new THREE.Vector2(0, 0) },
            planeCornerBL: { type: 'vec2', value: new THREE.Vector2(-1, -1) },
            planeDimensions: { type: 'vec2', value: new THREE.Vector2(2, 2) },
            planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100, 100) }
        }
        this.addAdditionalUniforms();
    }

    vertexShader() {
        return `
        varying vec2 vUv; 
    
        void main() {
          vUv = uv; 
    
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition; 
        }
        `
    }

    fragmentShader() {
        return "" +
            this.getUniformsString() +
            `
        varying vec2 vUv;

        const float G = 1.0;//TODO
  
        void main() {

            //coordinates as fractions of texture starting bottom left
            float x_frac = vUv.x;
            float y_frac = vUv.y;

            //coordinates in pixel in virtual texture starting bottom left
            int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
            int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
            int x_pixel_total = int(round(x_frac * (2.0*planeDimensionsPixel.x-1.0)));//TODO: const 2.0
            int y_pixel_total = int(round(y_frac * (2.0*planeDimensionsPixel.y-1.0)));//TODO: const 2.0

            int render_mode = 1;

            ivec2 pointer;
            vec4 data;
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            switch (render_mode) {
                case 0://raw texture output of all virtual textures
                    pointer = ivec2(x_pixel_total, y_pixel_total);
                    data = texelFetch(displayedTexture, pointer, 0);
                    gl_FragColor = vec4(data.x, data.y, data.z, data.a);
                    break;
                case 1://raw texture output of virtual texture
                    pointer = ivec2(x_pixel, y_pixel);
                    data = texelFetch(displayedTexture, pointer, 0);
                    gl_FragColor = vec4(data.x, data.y, data.z, data.a);
                    break;
            }
        `
            + this.fragmentShaderMethodComputation() +
            `
        }    
        `
            ;
    }

    /**
     * Automatically generates the shader code for uniforms from the method generateUniforms()
     * The example: 
     * 
     *  this.uniforms = {
     *      planeCenter: { type: 'vec2', value: new THREE.Vector2(0,0) },
     *      planeCornerBL: { type: 'vec2', value: new THREE.Vector2(-1,-1) },
     *      planeDimensions: { type: 'vec2', value: new THREE.Vector2(2,2) },
     *      planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100,100) }
     *  };
     *  
     * results in:
     *       
     *      uniform vec2 planeCenter; 
     *      uniform vec2 planeCornerBL; 
     *      uniform vec2 planeDimensions; 
     *      uniform vec2 planeDimensionsPixel; 
     * 
     * @returns shader code for all uniforms
     */
    getUniformsString() {
        return Object.keys(this.uniforms).map(key => {
            const type = this.uniforms[key].type;
            return `uniform ${type} ${key};`;
        }).join('\n');
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      REQUIRED METHODS
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * A texture can output a single vec4 for each pixel.
     * If more data per grid node is required, multiple pixels per grid node can be used.
     * 
     * @returns the number of "virtual textures" on the x axis, setting this value to 2 doubles the available data per node
     */
    getNumPixelsPerNodeX() {
        return 1;
    }

    /**
     * A texture can output a single vec4 for each pixel.
     * If more data per grid node is required, multiple pixels per grid node can be used.
     * 
     * @returns the number of "virtual textures" on the y axis, setting this value to 2 doubles the available data per node
     */
    getNumPixelsPerNodeY() {
        return 1;
    }

    /**
     * The actual computation of the shader is done in this method.
     * 
     * @returns partial shader code that is copied inside the main function of the shader
     */
    fragmentShaderMethodComputation() {        
        return `
        /*
        if(vUv.x > 0.0)
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        if(vUv.y > 0.0)
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
*/

        `
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      OPTIONAL METHODS
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The following uniforms are created for all offscreen renderers during generateUniforms():
     * - planeCenter
     * - planeCornerBL
     * - planeDimensions
     * - planeDimensionsPixel
     * 
     * Additional uniforms can be created in this method
     */
    addAdditionalUniforms() {
        this.uniforms["displayedTexture"] = { type: 'sampler2D', value: null};

    }

    setAdditionalUniforms() {
        this.textured_plane_mesh.material.uniforms.displayedTexture.value = this.displayedTexture;

    }

}

export { TextureRenderer }