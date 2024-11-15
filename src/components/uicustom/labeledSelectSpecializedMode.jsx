import React from 'react';
import LabeledSelect from './labeledSelect';
import * as Constants from "@/components/utility/constants";

const options = [
    { value: Constants.TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE, label: 'gravitational force: normal' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE_MAGNITUDE, label: 'gravitational force: magnitude' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_ADVECTION_TIME, label: 'return: advection time' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_ARC_LENGTH, label: 'return: arc length' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_POSITION, label: 'return: position' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE, label: 'return: relative position (normalized)' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE_MAGNITUDE, label: 'return: relative position (magnitude)' },       
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_DIRECTION, label: 'return: direction' },   
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE, label: 'return: FTLE' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE_BOTH, label: 'return: FTLE (both)' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_SUCCESS, label: 'return: success' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_SEED_VELOCITY_MAGNITUDE, label: 'seed: velocity magnitude' },  
    { value: Constants.TEXTURE_MODE_SPECIALIZED_HAMILTONIAN_ERROR, label: 'return: hamiltonian error' },
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_DIST_BODIES, label: 'return: nearest body' },    
    
];

const LabeledSelectSpecializedMode = () => (
    <LabeledSelect 
        name="selectSpecializedMode"
        labelText="specialized mode"
        setUiStateKey="UI_STATE_RENDERING_SPECIALIZED_MODE"
        emit="false"
        options={options}
    />
);

export default LabeledSelectSpecializedMode;