import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import * as Constants from "../utility/constants";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import * as TEXTURE_ACCESS from "@/components/glsl/texture_access";
import * as TEXTURE_ACCESS_DECLARATIONS from "@/components/glsl/texture_access_declarations";


const glsl = x => x[0];
/**
 * TODO
 * This class renders the textures generated by offscreen renderers.
 * It can render the data:
 * - specialized: TODO specific use cases tailored for the input data
 * - raw: from the uv data access the nearest texel from the input texture and render as is
 * - processed: TODO more control over the data
 */
class TextureRenderer {

    constructor(renderer, simulationParameters, colorMaps, scene, useAnglePlane) {
        this.renderer = renderer;
        this.simulationParameters = simulationParameters;
        this.colorMaps = colorMaps;
        this.scene = scene;
        this.useAnglePlane = useAnglePlane;
    }
    
    getPlaneDimensionX(){
        return this.useAnglePlane ? this.simulationParameters.angle_pixels_x : this.simulationParameters.domain_pixels_x;
    }

    getPlaneDimensionY(){
        return this.useAnglePlane ? this.simulationParameters.angle_pixels_y : this.simulationParameters.domain_pixels_y;
    }

    initialize() {
        console.warn("INITIALIZE TextureRenderer");

        this.width = 100;
        this.height = 100;

        this.generateUniforms();

        this.textured_material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
            glslVersion: THREE.GLSL3
        })
        this.textured_material.transparent = true;
        this.textured_material.opacity = 0.5;

        this.initializeTexturedGeometry();

        //console.warn(this.fragmentShader())
    }

    initializeTexturedGeometry(){
        //define in child class
        console.error("initializeTexturedGeometry not defined");
    }



    changeDisplayedTexture(texture) {
        this.displayedTexture = texture;
    }

    changeDisplayedTextureBackwards(texture) {
        this.displayedTextureBackwards = texture;
    }

    updateTexturedMesh() {
        this.setAdditionalUniforms();
        this.textured_mesh.material.uniforms.mu.value = this.simulationParameters.mu;
        this.textured_mesh.material.uniforms.angular_velocity.value = this.simulationParameters.angular_velocity;
        this.textured_mesh.material.uniforms.primary_x.value = this.simulationParameters.getPrimaryX();
        this.textured_mesh.material.uniforms.secondary_x.value = this.simulationParameters.getSecondaryX();
        this.textured_mesh.material.uniforms.primary_mass.value = this.simulationParameters.getPrimaryMass();
        this.textured_mesh.material.uniforms.secondary_mass.value = this.simulationParameters.getSecondaryMass();
        this.textured_mesh.material.uniforms.planeCornerBL.value.x = this.simulationParameters.domain_min_x;
        this.textured_mesh.material.uniforms.planeCornerBL.value.y = this.simulationParameters.domain_min_y;
        this.textured_mesh.material.uniforms.planeDimensions.value.x = this.simulationParameters.domain_dimension_x;
        this.textured_mesh.material.uniforms.planeDimensions.value.y = this.simulationParameters.domain_dimension_y;
        this.textured_mesh.material.uniforms.planeDimensionsPixel.value.x = this.getPlaneDimensionX();
        this.textured_mesh.material.uniforms.planeDimensionsPixel.value.y = this.getPlaneDimensionY();
        return;
    }

    generateUniforms() {
        this.uniforms = {
            mu: { type: 'float', value: 0.1 },
            angular_velocity: { type: 'float', value: 1.0 },
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
        return glsl`
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
            this.getUniformsString() 
            + LINALG.SHADER_MODULE_LINALG + "\n" 
            + UTILITY.SHADER_MODULE_UTILITY + "\n" 
            + TEXTURE_ACCESS_DECLARATIONS.SHADER_MODULE_TEXTURE_ACCESS_DECLARATIONS + "\n" 
            + glsl`

        varying vec2 vUv;
        out vec4 outputColor;

        const float G = 1.0;//TODO
  
        void RenderSpecializedMode(float x_frac, float y_frac);
        vec3 mapScalarToColor(float scalar);
        vec3 mapScalarToColorWithInterval(float scalar, float minValue, float maxValue);
        vec3 normalMappingVec2(vec2 vector);
        vec3 normalMappingVec3(vec3 vector);

        void main() {

            //coordinates as fractions of texture starting bottom left
            float x_frac = vUv.x;
            float y_frac = vUv.y;

            //coordinates in pixel in virtual texture starting bottom left
            int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
            int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
            int x_pixel_total = int(round(x_frac * (2.0*planeDimensionsPixel.x-1.0)));//TODO: const 2.0
            int y_pixel_total = int(round(y_frac * (2.0*planeDimensionsPixel.y-1.0)));//TODO: const 2.0

            int x_offset = rendering_raw_mode_x_texture_index * int(planeDimensionsPixel.x);
            int y_offset = rendering_raw_mode_y_texture_index * int(planeDimensionsPixel.y);

            ivec3 pointer;
            vec4 data;
            outputColor = vec4(0.0, 0.0, 0.0, 1.0);
            switch (rendering_texture_mode) {
                case 0://specialized
                    RenderSpecializedMode(x_frac, y_frac);
                    break;
                case 1://raw texture output of virtual texture
                    pointer = ivec3(x_pixel+x_offset, y_pixel+y_offset, rendering_raw_mode_layer);
                    data = rendering_forward ? texelFetch(displayedTexture, pointer, 0) : texelFetch(displayedTextureBackwards, pointer, 0);
                    outputColor = vec4(data.x, data.y, data.z, data.a);
                    break;
                case 2://raw texture output of all virtual textures
                    pointer = ivec3(x_pixel_total, y_pixel_total, rendering_raw_mode_layer);
                    data = rendering_forward ? texelFetch(displayedTexture, pointer, 0) : texelFetch(displayedTextureBackwards, pointer, 0);
                    outputColor = vec4(data.x, data.y, data.z, data.a);
                    break;
            }
        `
            + this.fragmentShaderMethodComputation() +
            glsl`
        }   
        
        void RenderSpecializedMode(float x_frac, float y_frac){
            int x_virtual = 0;
            int y_virtual = 0;
            int z_layer = 0;
            int component = 0;
            bool forward = rendering_forward;
            vec3 col_forward;
            vec3 col_backwards;
            outputColor = vec4(1.0, 0.0, 1.0, 1.0);

            float scalar;
            vec4 data;
            vec4 data_seeds;
            switch (rendering_specialized_mode) {
                case 0://gravitational force (normal)
                    x_virtual = 0;
                    y_virtual = 0;
                    z_layer = 0;
                    data = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer);
                    outputColor = vec4(normalMappingVec2(vec2(data.x, data.y)), opacity);
                    break;
                case 1://gravitational force (magnitude)
                    x_virtual = 0;
                    y_virtual = 0;
                    z_layer = 0;
                    component = 3;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    outputColor = vec4(mapScalarToColor(scalar), opacity);
                    break;
                case 2://TEXTURE_MODE_SPECIALIZED_RETURN_ADVECTION_TIME
                    int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
                    int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
                    x_virtual = 0;
                    y_virtual = 1;
                    z_layer = return_layer;
                    component = 1;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    outputColor = vec4(mapScalarToColor(scalar), opacity);
                    //outputColor = vec4(scalar, 0.0, 0.0, opacity);

                    //ivec3 pointer = ivec3(x_pixel, y_pixel, rendering_raw_mode_layer);
                    //data = texelFetch(displayedTexture, pointer, 0);
                    //outputColor = vec4(data.x, data.y, data.z, data.a);

                    //if(scalar < 10.0){                        
                    //    outputColor = vec4(1.0, 0.0, 0.0, 1.0);
                    //}
                    break;
                case 3://TEXTURE_MODE_SPECIALIZED_RETURN_ARC_LENGTH
                    //int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
                    //int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
                    x_virtual = 0;
                    y_virtual = 1;
                    z_layer = return_layer;
                    component = 2;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    outputColor = vec4(mapScalarToColor(scalar), opacity);
                    //outputColor = vec4(scalar, 0.0, 0.0, opacity);

                    //ivec3 pointer = ivec3(x_pixel, y_pixel, rendering_raw_mode_layer);
                    //data = texelFetch(displayedTexture, pointer, 0);
                    //outputColor = vec4(data.x, data.y, data.z, data.a);

                    //if(scalar < 10.0){                        
                    //    outputColor = vec4(1.0, 0.0, 0.0, 1.0);
                    //}
                    break;
                case 4://TEXTURE_MODE_SPECIALIZED_RETURN_POSITION
                    x_virtual = 0;
                    y_virtual = 0;
                    z_layer = return_layer;
                    data = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer);
                    //outputColor = vec4(normalMappingVec2(data.xy), opacity);
                    outputColor = vec4(normalMappingVec3(data.xyz), opacity);
                    break;
                case 5://TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE
                    x_virtual = 0;
                    y_virtual = 0;
                    z_layer = return_layer;
                    data = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer);
                    data_seeds = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer-1);
                    outputColor = vec4(normalMappingVec3(data.xyz - data_seeds.xyz), opacity);
                    break;
                case 6://TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE_MAGNITUDE
                    x_virtual = 0;
                    y_virtual = 0;
                    z_layer = return_layer;
                    data = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer);
                    data_seeds = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer-1);
                    float magnitude = length(data.xyz - data_seeds.xyz);
                    outputColor = vec4(mapScalarToColor(magnitude), opacity);
                    break;                    
                case 7://TEXTURE_MODE_SPECIALIZED_RETURN_DIRECTION
                    x_virtual = 1;
                    y_virtual = 0;
                    z_layer = return_layer;
                    data = InterpolateVec4Wrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer);
                    outputColor = vec4(normalMappingVec3(data.xyz), opacity);
                    break;
                case 8://TEXTURE_MODE_SPECIALIZED_RETURN_FTLE
                    x_virtual = 1;
                    y_virtual = 1;
                    z_layer = return_layer;
                    component = ftle_type;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);

                    if(false){//TODO parameter to use color map instead of red blue
                        //map to color map
                        outputColor = vec4(mapScalarToColor(scalar), opacity);
                    }
                    else{
                        //map to either red or blue
                        float t = (scalar - scalar_min) / (scalar_max - scalar_min);
                        t = clamp(t, 0.0, 1.0);
    
                        col_forward = vec3(1.0, 1.0-t, 1.0-t);
                        col_backwards = vec3(1.0-t, 1.0-t, 1.0);
                        outputColor = forward ? vec4(col_forward, opacity) : vec4(col_backwards, opacity);
                    }
                    break;
                case 9://TEXTURE_MODE_SPECIALIZED_RETURN_FTLE_BOTH
                    x_virtual = 1;
                    y_virtual = 1;
                    z_layer = return_layer;
                    component = ftle_type;
                    scalar = InterpolateScalarWrapper(true, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    float scalarBackwards = InterpolateScalarWrapper(false, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    float t_forward = (scalar - scalar_min) / (scalar_max - scalar_min);
                    float t_backwards = (scalarBackwards - scalar_min) / (scalar_max - scalar_min);
                    t_forward = clamp(t_forward, 0.0, 1.0);
                    t_backwards = clamp(t_backwards, 0.0, 1.0);

                    col_forward = vec3(1.0, 1.0-t_forward, 1.0-t_forward);
                    col_backwards = vec3(1.0-t_backwards, 1.0-t_backwards, 1.0);
                    outputColor = vec4(mix(col_forward, col_backwards, 0.5), opacity);
                    break;
                case 10://TEXTURE_MODE_SPECIALIZED_RETURN_SUCCESS
                    x_virtual = 0;
                    y_virtual = 1;
                    z_layer = return_layer;
                    component = 0;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    outputColor = vec4(mapScalarToColorWithInterval(scalar, 0.0, 1.0), opacity);
                    break;
                case 11://TEXTURE_MODE_SPECIALIZED_SEED_VELOCITY_MAGNITUDE
                    x_virtual = 1;
                    y_virtual = 0;
                    z_layer = 0;
                    component = 3;
                    scalar = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);
                    outputColor = vec4(mapScalarToColorWithInterval(scalar, scalar_min, scalar_max), opacity);
                    break;
            }

        }      

        vec3 mapScalarToColor(float scalar){
            int bin_count = 256;

            float t = (scalar - scalar_min) / (scalar_max - scalar_min);
            int bin_index = int(t * float(bin_count-1));
            bin_index = clamp(bin_index, 0, bin_count-1);
            vec3 color = texelFetch(colorMapsTexture, ivec2(bin_index, 0), 0).rgb;

            return vec3(color);
        }

        vec3 mapScalarToColorWithInterval(float scalar, float minValue, float maxValue){
            int bin_count = 256;

            float t = (scalar - minValue) / (maxValue - minValue);
            int bin_index = int(t * float(bin_count-1));
            bin_index = clamp(bin_index, 0, bin_count-1);
            vec3 color = texelFetch(colorMapsTexture, ivec2(bin_index, 0), 0).rgb;

            return vec3(color);
        }

        vec3 normalMappingVec2(vec2 vector){

            vec2 normal = normalize(vector);
            vec2 mapped = 0.5 * normal + 0.5;

            return vec3(mapped.x, mapped.y, 0.0);
        }

        vec3 normalMappingVec3(vec3 vector){

            vec3 normal = normalize(vector);
            vec3 mapped = 0.5 * normal + 0.5;

            return mapped;
        }

        ` + "\n" 
        + TEXTURE_ACCESS.SHADER_MODULE_TEXTURE_ACCESS
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
        this.uniforms["displayedTexture"] = { type: 'sampler3D', value: null };
        this.uniforms["displayedTextureBackwards"] = { type: 'sampler3D', value: null };
        this.uniforms["colorMapsTexture"] = { type: 'sampler2D', value: null };
        this.uniforms["rendering_texture_mode"] = { type: 'int', value: parseInt(Constants.TEXTURE_MODE_SPECIALIZED) };
        this.uniforms["rendering_specialized_mode"] = { type: 'int', value: parseInt(Constants.TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE) };
        this.uniforms["return_layer"] = { type: 'int', value: Constants.LAYER_INDEX_FIRST_RETURN };
        this.uniforms["rendering_raw_mode_layer"] = { type: 'int', value: 0 };
        this.uniforms["rendering_forward"] = { type: 'bool', value: true };        
        this.uniforms["rendering_raw_mode_x_texture_index"] = { type: 'int', value: 0 };
        this.uniforms["rendering_raw_mode_y_texture_index"] = { type: 'int', value: 0 };

        this.uniforms["scalar_min"] = { type: 'float', value: 0.0 };
        this.uniforms["scalar_max"] = { type: 'float', value: 1.0 };
        this.uniforms["opacity"] = { type: 'float', value: 1.0 };

        this.uniforms["ftle_type"] = { type: 'int', value: Constants.FTLE_TYPE_PSFTLE };
        this.uniforms["scale_vertices_by_velocity_magnitude"] = { type: 'bool', value: false };

        
        
    }

    setAdditionalUniforms() {
        this.textured_mesh.material.uniforms.displayedTexture.value = this.displayedTexture;
        this.textured_mesh.material.uniforms.displayedTextureBackwards.value = this.displayedTextureBackwards;
        this.textured_mesh.material.uniforms.colorMapsTexture.value = this.colorMaps.texture;
        this.textured_mesh.material.uniforms.rendering_texture_mode.value = this.simulationParameters.rendering_texture_mode;
        this.textured_mesh.material.uniforms.rendering_specialized_mode.value = this.simulationParameters.rendering_specialized_mode;
        this.textured_mesh.material.uniforms.return_layer.value = this.simulationParameters.return_layer;
        this.textured_mesh.material.uniforms.rendering_forward.value = this.simulationParameters.rendering_forward;        
        this.textured_mesh.material.uniforms.rendering_raw_mode_layer.value = this.simulationParameters.rendering_raw_mode_layer;
        this.textured_mesh.material.uniforms.rendering_raw_mode_x_texture_index.value = this.simulationParameters.rendering_raw_mode_x_texture_index;
        this.textured_mesh.material.uniforms.rendering_raw_mode_y_texture_index.value = this.simulationParameters.rendering_raw_mode_y_texture_index;
        this.textured_mesh.material.uniforms.scalar_min.value = this.simulationParameters.scalar_min;
        this.textured_mesh.material.uniforms.scalar_max.value = this.simulationParameters.scalar_max;
        this.textured_mesh.material.uniforms.opacity.value = this.simulationParameters.opacity;
        this.textured_mesh.material.uniforms.ftle_type.value = this.simulationParameters.rendering_ftle_type;

        
        this.textured_mesh.material.uniforms.scale_vertices_by_velocity_magnitude.value = this.shouldScaleVerticesByVelocityMagnitude();

        console.warn("this.uniforms", this.uniforms);
    }

    shouldScaleVerticesByVelocityMagnitude(){
        return false;
    }

}

export { TextureRenderer }