export const EVENT_RESIZE_PANEL = "EVENT_RESIZE_PANEL";
export const EVENT_DATA_UPDATE = "EVENT_DATA_UPDATE";
export const EVENT_DATA_UPDATE_STREAMLINE = "EVENT_DATA_UPDATE_STREAMLINE";
export const EVENT_CAMERA_UPDATE = "EVENT_CAMERA_UPDATE";
export const EVENT_RENDERING_UPDATE = "EVENT_RENDERING_UPDATE";
export const EVENT_RENDERING_UPDATE_CLICKED_POSITION = "EVENT_RENDERING_UPDATE_CLICKED_POSITION";
export const EVENT_ALIGN_CAMERA = "EVENT_ALIGN_CAMERA";
export const EVENT_SELECT_CHANGED = "EVENT_SELECT_CHANGED";
export const EVENT_SEED_DIRECTION_CHANGED = "EVENT_SEED_DIRECTION_CHANGED";
export const EVENT_SEED_POSITION_CHANGED = "EVENT_SEED_POSITION_CHANGED";
export const EVENT_WRITE_FROM_URL_TO_UI = "EVENT_WRITE_FROM_URL_TO_UI";
export const EVENT_WRITE_FROM_UI_TO_URL = "EVENT_WRITE_FROM_UI_TO_URL";
export const EVENT_INITIALIZATION_COMPLETED = "EVENT_INITIALIZATION_COMPLETED";

export const NUM_ELEMENTS_THAT_REQUIRE_INITIALIZATION = 2;//main and aux container

export const BEHAVIOR_CONTROL_CAMERA = "BEHAVIOR_CONTROL_CAMERA";
export const BEHAVIOR_MOVE_SEED = "BEHAVIOR_MOVE_SEED";

export const TEXTURE_MODE_SPECIALIZED = 0;
export const TEXTURE_MODE_RAW_VIRTUAL = 1;
export const TEXTURE_MODE_RAW_TEXTURE = 2;

export const TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE = 0;
export const TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE_MAGNITUDE = 1;
export const TEXTURE_MODE_SPECIALIZED_RETURN_ADVECTION_TIME = 2;
export const TEXTURE_MODE_SPECIALIZED_RETURN_ARC_LENGTH = 3;
export const TEXTURE_MODE_SPECIALIZED_RETURN_POSITION = 4;
export const TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE = 5;
export const TEXTURE_MODE_SPECIALIZED_RETURN_POSITION_RELATIVE_MAGNITUDE = 6;
export const TEXTURE_MODE_SPECIALIZED_RETURN_DIRECTION = 7;
export const TEXTURE_MODE_SPECIALIZED_RETURN_FTLE = 8;
export const TEXTURE_MODE_SPECIALIZED_RETURN_FTLE_BOTH = 9;
export const TEXTURE_MODE_SPECIALIZED_RETURN_SUCCESS = 10;
export const TEXTURE_MODE_SPECIALIZED_SEED_VELOCITY_MAGNITUDE = 11;
export const TEXTURE_MODE_SPECIALIZED_HAMILTONIAN_ERROR = 12;
export const TEXTURE_MODE_SPECIALIZED_RETURN_DIST_BODIES = 13;

export const OFFSCREEN_RENDERER_SEEDS = 0;
export const OFFSCREEN_RENDERER_GRAVITATIONAL_FORCE = 1;
export const OFFSCREEN_RENDERER_FLOW_MAP = 2;
export const OFFSCREEN_RENDERER_SEEDS_AND_RETURNS = 3;

export const TERMINATION_METHOD_UNLIMITED = "0";
export const TERMINATION_METHOD_FIRST_RETURN = "1";
export const TERMINATION_METHOD_SECOND_RETURN = "2";

export const LAYER_INDEX_FIRST_RETURN = 1;
export const LAYER_INDEX_SECOND_RETURN = 2;

export const RENDERER_DIRECTION_FORWARD = true;
export const RENDERER_DIRECTION_BACKWARD = false;

export const FTLE_TYPE_PSFTLE = 0;
export const FTLE_TYPE_END_POSITION = 1;
export const FTLE_TYPE_END_VELOCITY = 2;

export const AUX_CONTENT_DEFAULT = 0;
export const AUX_CONTENT_SPHERE = 1;

export const AUX_GRID_DIRECTION_THETA_RIGHT_PHI_UP = 0;
export const AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT = 1;

export const RENDERER_ID_MAIN = 0;
export const RENDERER_ID_AUX = 1;
