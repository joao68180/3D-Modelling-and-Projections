/**
 * @author André Narquel - 67870
 * @author João Fernandes - 68180
 */

import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, perspective, flatten, mat4, vec4, inverse, mult } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multMatrix, multScale, multTranslation, popMatrix, pushMatrix, } from "../../libs/stack.js";
import { sceneNode } from "./sceneNode.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as SPHERE from '../../libs/objects/sphere.js';

const FRONT_VIEW = [[0, 0.6, 1], [0, 0.6, 0], [0, 1, 0]];
const LEFT_VIEW = [[-1, 0.6, 0], [0, 0.6, 0], [0, 1, 0]];
const TOP_VIEW = [[0, 1.6, 0], [0, 0.6, 0], [0, 0, -1]];


const CANNON_ANGLE_MIN = -45;
const CANNON_ANGLE_MAX = 0;
const NUM_X = 15;
const NUM_Y = 15;
const TILE_SIZE = 0.5;
const X_LIMIT = (NUM_X * TILE_SIZE) / 2;
const SPEED_FACTOR = 0.2;

const FOV = 60;
const wheelRadius = 0.16;
const littleWheelRadius = 0.12;

const NEAR = 0.01;
const FAR = 50;


let gridview = false;
let parallel = true;
let axonometric = true;
let theta = 0;
let gamma = 0;
let currentViewNum = 1;
let l = 0.5;
let globalTank;
let cannonTipWorldMatrix = mat4();
let tomatoes = [];
let cannonAngle = 0;
let cabinRotationAngle = 0;
let tankMov = 0;
let zoomRadius = 1.8;


function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    //default
    let mProjection = ortho(-aspect * zoomRadius, aspect * zoomRadius, -zoomRadius, zoomRadius, NEAR * zoomRadius, FAR * zoomRadius);
    let mView = lookAt([0, 0.6, 1], [0, 0.6, 0], [0, 1, 0]);

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    CYLINDER.init(gl);
    TORUS.init(gl);
    CUBE.init(gl);
    PYRAMID.init(gl);
    SPHERE.init(gl);


    /**
     * Function that supports the structure of the tank 
     * @returns a javascript object with relevant nodes from our tree structure
     */
    function createTank() {

        const drawBase = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.561, 0.592, 0.475, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawBaseSides = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.420, 0.467, 0.360, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawExhaust = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.15, 0.15, 0.15, 1.0]);
            uploadModelView();
            TORUS.draw(gl, program, mode);
        }

        const drawInside = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0, 0, 0, 1.0]);
            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        }

        const drawWhellCoverSide = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.55, 0.55, 0.55, 1]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawCabin = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.15, 0.15, 0.15, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawCabinFront = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.15, 0.15, 0.15, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawCabinRoof = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.561, 0.592, 0.475, 1.0]);
            uploadModelView();
            SPHERE.draw(gl, program, mode);
        };

        const drawCannonSup = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.55, 0.55, 0.55, 1]);
            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        };

        const drawCannon = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.55, 0.55, 0.55, 1]);
            uploadModelView();
            TORUS.draw(gl, program, mode);
        }

        const drawWheel = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0, 0, 0, 0.99]);
            uploadModelView();
            TORUS.draw(gl, program, mode);
        };

        const drawRims = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.855, 0.647, 0.12, 1.0]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.LINES);
        };

        const drawCover = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0.15, 0.15, 0.15, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        };

        const drawBlackCover = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0, 0, 0, 0.8]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        }

        const drawMissileTip = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [1, 0, 0.3, 1]);
            uploadModelView();
            PYRAMID.draw(gl, program, mode);
            gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [0, 0, 0, 0.8]);
        }

        const drawMissile = () => {
            gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), [0, 0, 0, 1]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        }


        //Root node
        const tankRoot = new sceneNode("tankRoot");

        //Base
        const baseNode = new sceneNode("base", drawBase);
        baseNode.translation = [0, 0.30, 0];
        baseNode.scale = [1.2, 0.3, 1];
        tankRoot.addChild(baseNode);

        //BaseSides
        const baseSides = [];
        const baseSidesZOffsets = [-0.5, 0.5];

        for (let z of baseSidesZOffsets) {
            const baseSideNode = new sceneNode(`baseSide_${z}`, drawBaseSides);
            baseSideNode.translation = [0, 0.38, z];
            baseSideNode.rotation = [0, 0, 0];
            baseSideNode.scale = [1.303, 0.2, 0.2];

            tankRoot.addChild(baseSideNode);
            baseSides.push(baseSideNode);
        }

        //Exhaust
        const exhausts = [];
        const exhaustZOffsets = [-0.03, 0, 0.03];
        for (let z of exhaustZOffsets) {
            const exhaustsNode = new sceneNode('baseSide_${z}', drawExhaust);
            exhaustsNode.translation = [0.6, z == 0 ? 0.23 : 0.175, z];
            exhaustsNode.rotation = [0, 60, 60];
            exhaustsNode.scale = [0.04, 0.2, 0.04];

            const insideNode = new sceneNode('baseSide_${z}', drawInside);
            insideNode.translation = [0, -0.1, z];
            insideNode.scale = [1, 0.01, 1];

            exhaustsNode.addChild(insideNode);
            tankRoot.addChild(exhaustsNode);
            exhausts.push(exhaustsNode);
        }


        //WhellCoversSide
        const WhellCoversSide = [];
        const WhellCoversSideZOffsets = [-0.63, 0.63];
        const WhellCoversSideYOffsets = [0.40, 0.30];
        for (let z of WhellCoversSideZOffsets) {
            for (let y of WhellCoversSideYOffsets) {
                const WhellCoversSideNode = new sceneNode(`baseSide__${y}_${z}`, drawWhellCoverSide);
                WhellCoversSideNode.translation = [0, y, y > 0.32 ? (z > 0 ? 0.607 : -0.607) : z];
                WhellCoversSideNode.rotation = [y > 0.32 ? (z > 0 ? -22 : 22) : 0, 0, 0];
                WhellCoversSideNode.scale = [1.3, y > 0.32 ? 0.14 : 0.1, 0.03];

                tankRoot.addChild(WhellCoversSideNode);
                WhellCoversSide.push(WhellCoversSideNode);
            }
        }

        //Cabin
        const cabinNode = new sceneNode("cabin", drawCabin);
        cabinNode.translation = [0.17, 0.45, 0];
        cabinNode.scale = [0.30, 0.30, 0.30];
        tankRoot.addChild(cabinNode);

        //Cabinfront
        const cabinFrontNode = new sceneNode("cabinFront", drawCabinFront);
        cabinFrontNode.translation = [-0.49, -0.085, 0];
        cabinFrontNode.rotation = [0, 0, 60];
        cabinFrontNode.scale = [1, 0.6, 1];
        cabinNode.addChild(cabinFrontNode);

        //Cabinback
        const cabinBack = new sceneNode("cabinback", drawCabin);
        cabinBack.translation = [0.65, 0, 0];
        cabinBack.scale = [0.30, 1, 1];
        cabinNode.addChild(cabinBack);

        //CabinRoof
        const cabinRoofNode = new sceneNode("cabinRoof", drawCabinRoof);
        cabinRoofNode.translation = [0.12, 0.50, 0];
        cabinRoofNode.scale = [0.9, 0.3, 0.7];
        cabinNode.addChild(cabinRoofNode);

        //CannonSupport
        const cannonSuppNode = new sceneNode("cannonSupp", drawCannonSup);
        cannonSuppNode.translation = [-0.60, 0.27, 0];
        cannonSuppNode.rotation = [-90, 0, 0];
        cannonSuppNode.scale = [0.4, 0.2, 0.4];
        cabinNode.addChild(cannonSuppNode);

        //Cannon
        const cannonNode = new sceneNode("cannon", drawCannon);
        cannonNode.translation = [-3, 0, 0];
        cannonNode.rotation = [-90, 90, 0];
        cannonNode.scale = [0.4, 30, 0.7];
        cannonSuppNode.addChild(cannonNode);

        //CannonInside
        const insideNode = new sceneNode("inside", drawInside);
        insideNode.translation = [0, 0.2, 0];
        insideNode.scale = [1.1, 0.01, 1.1];
        cannonNode.addChild(insideNode);

        //CannonFront
        const cannonFrontNode = new sceneNode("cannonFront", drawCannon);
        cannonFrontNode.translation = [0, 0.17, 0];
        cannonFrontNode.rotation = [0, 90, 0];
        cannonFrontNode.scale = [1.2, 0.2, 1.2];
        cannonNode.addChild(cannonFrontNode);

        //Cannon Tip
        const cannonTipNode = new sceneNode("cannonTip");
        cannonTipNode.translation = [1.60, -5, 0];
        cannonTipNode.scale = [1 / 1.1, 1 / 0.01, 1 / 1.1];
        insideNode.addChild(cannonTipNode);

        // Wheels
        const wheels = [];
        const wheelZPos = [0.48, -0.48];
        const wheelXOffsets = [-0.36, -0.12, 0.12, 0.36];
        for (let z of wheelZPos) {
            for (let x of wheelXOffsets) {
                const wheelNode = new sceneNode(`wheel_${x}_${z}`, drawWheel);
                wheelNode.translation = [x, 0.13, z];
                wheelNode.rotation = [90, 0, 0];
                wheelNode.scale = [0.16, 0.5, 0.16];

                const rimNode = new sceneNode(`rim_${x}_${z}`, drawRims);
                rimNode.translation = [0, z > 0 ? 0.08 : -0.08, 0];
                rimNode.scale = [1, 0.01, 1];

                wheelNode.addChild(rimNode);
                tankRoot.addChild(wheelNode);
                wheels.push(wheelNode);
            }
        }

        // Little wheels
        const littleWheels = [];
        const littleWheelZPos = [0.48, -0.48];
        const littleWheelXOffsets = [-0.55, 0.55];
        for (let z of littleWheelZPos) {
            for (let x of littleWheelXOffsets) {
                const wheelNode = new sceneNode(`littleWheel_${x}_${z}`, drawWheel);
                wheelNode.translation = [x, 0.25, z];
                wheelNode.rotation = [90, 0, 0];
                wheelNode.scale = [0.12, 0.5, 0.12];


                const rimNode = new sceneNode(`littleRim_${x}_${z}`, drawRims);
                rimNode.translation = [0, z > 0 ? 0.08 : -0.08, 0];
                rimNode.scale = [1, 0.01, 1];

                wheelNode.addChild(rimNode);
                tankRoot.addChild(wheelNode);
                littleWheels.push(wheelNode);
            }
        }

        //Wheel Cover
        const covers = [];
        const coverZPos = [0.48, -0.48];
        const coverYPos = [0.01, 0.35];
        for (let z of coverZPos) {
            for (let y of coverYPos) {
                const coverNode = new sceneNode(`wheelCover_${y}_${z}`, drawCover);
                coverNode.translation = [0, y, z];
                coverNode.scale = [y == 0.35 ? 1.3 : 1, 0.02, 0.27]
                tankRoot.addChild(coverNode);
                covers.push(coverNode);
            }
        }

        //InsideCovers
        const insideCover = [];
        const covZPos = [0.42, -0.42];
        for (let z of covZPos) {
            const insideNode = new sceneNode(`insideCover_${z}`, drawBlackCover);
            insideNode.translation = [0, 0.15, z];
            insideNode.rotation = [0, 0, 0];
            insideNode.scale = [1, 0.3, 0.2];
            tankRoot.addChild(insideNode);
            insideCover.push(insideNode);
        }

        const insideCoverSide = [];
        const cov2ZPos = [0.42, -0.42];
        const cov2XPos = [0.53, -0.53];
        for (let z of cov2ZPos) {
            for (let x of cov2XPos) {
                const insideSideNode = new sceneNode(`insideSideCover_${z}`, drawBlackCover);
                insideSideNode.translation = [x, 0.18, z];
                insideSideNode.rotation = [0, 0, x > 0 ? -37 : 37];
                insideSideNode.scale = [0.15, 0.36, 0.2];
                tankRoot.addChild(insideSideNode);
                insideCoverSide.push(insideSideNode);
            }
        }



        //Side Front Wheel Cover
        const sCovers = [];
        const sCoverZPos = [0.48, -0.48];
        const sCoverYPos = [0.03, 0.309];
        for (let z of sCoverZPos) {
            for (let y of sCoverYPos) {
                const sCoverNode = new sceneNode(`sideWheelCover_${y}_${z}`, drawCover);
                sCoverNode.translation = [y == 0.309 ? -0.67 : -0.595, y == 0.03 ? 0.133 : y, z];
                sCoverNode.rotation = [0, 0, y == 0.03 ? -54 : 60];
                sCoverNode.scale = [y == 0.03 ? 0.34 : 0.1, 0.02, 0.27];
                tankRoot.addChild(sCoverNode);
                sCovers.push(sCoverNode);
            }
        }

        //Side Back Wheel Cover
        const sbCovers = [];
        const sbCoverZPos = [0.48, -0.48];
        const sbCoverYPos = [0.03, 0.309];
        for (let z of sbCoverZPos) {
            for (let y of sbCoverYPos) {
                const sbCoverNode = new sceneNode(`sideBackWheelCover_${y}_${z}`, drawCover);
                sbCoverNode.translation = [y == 0.309 ? 0.67 : 0.595, y == 0.03 ? 0.133 : y, z];
                sbCoverNode.rotation = [0, 0, y == 0.03 ? 54 : -60];
                sbCoverNode.scale = [y == 0.03 ? -0.34 : -0.1, 0.02, 0.27];
                tankRoot.addChild(sbCoverNode);
                sbCovers.push(sbCoverNode);
            }
        }

        //MissileSup
        const missilesSup = [];
        const supZPos = [-0.65, 0.65];
        for (let z of supZPos) {
            const missileSupNode = new sceneNode(`missileSup_1`, drawBlackCover);
            missileSupNode.translation = [0, 0.38, z];
            missileSupNode.rotation = [z > 0 ? 20 : -20, 0, 0];
            missileSupNode.scale = [0.02, 0.2, 0.02];

            baseNode.addChild(missileSupNode);
            missilesSup.push(missileSupNode);
        }

        //Missiles
        const missiles = [];
        const missilesZPos = [-0.7, 0.7];
        for (let z of missilesZPos) {
            const missileNode = new sceneNode(`missile_${z}`, drawMissile);
            missileNode.translation = [0.05, 0.55, z];
            missileNode.rotation = [0, 0, 0];
            missileNode.scale = [0.3, 0.15, 0.05];
            baseNode.addChild(missileNode);

            const missileTipNode = new sceneNode(`missileTip_${z}`, drawMissileTip)
            missileTipNode.translation = [-0.75, 0, 0];
            missileTipNode.rotation = [0, 0, 90];
            missileTipNode.scale = [1, 0.5, 1];
            missileNode.addChild(missileTipNode);

            missileNode.initialTranslation = missileNode.translation.slice();
            missileNode.fired = false;

            missiles.push(missileNode);

        }

        return {
            root: tankRoot,
            nodes: {
                base: baseNode,
                cabin: cabinNode,
                cannon: cannonNode,
                cannonSupp: cannonSuppNode,
                cannonTip: cannonTipNode,
                wheels: wheels,
                littleWheels: littleWheels,
                missiles: missiles
            }
        };
    }

    /**
     * Function that supports the tank movement -> wheel rotation logic
     * @param {number} tankMovDelta 
     */
    function updateWheelRotation(tankMovDelta) {
        const degPerMoveLarge = (tankMovDelta / wheelRadius) * (180 / Math.PI);
        const degPerMoveLittle = (tankMovDelta / littleWheelRadius) * (180 / Math.PI);

        for (let wheel of globalTank.nodes.wheels) {
            wheel.rotation[2] -= degPerMoveLarge;
        }

        for (let wheel of globalTank.nodes.littleWheels) {
            wheel.rotation[2] -= degPerMoveLittle;
        }
    }

    /**
     * Function that draws a red tomato (red sphere)
     */
    function drawTomato() {
        gl.uniform4fv(gl.getUniformLocation(program, "u_color"), [1, 0, 0, 1]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }


    /**
     * Creates a tomato scene node with initial position and velocity,
     * and applies velocity + gravity on each frame.
     * @param {vec3} startPos
     * @param {vec3} startVelWorld 
     */
    function createTomato(startPos, startVelWorld) {
        const tomatoNode = new sceneNode("tomato", drawTomato);

        tomatoNode.translation = startPos.slice();
        tomatoNode.scale = [0.22, 0.22, 0.22];

        tomatoNode.velocity = [
            startVelWorld[0] * SPEED_FACTOR,
            startVelWorld[1] * SPEED_FACTOR,
            startVelWorld[2] * SPEED_FACTOR
        ];

        tomatoNode.alive = true;

        const g = [0, -0.0009, 0];
        tomatoNode.update = function () {
            this.translation[0] += this.velocity[0];
            this.translation[1] += this.velocity[1];
            this.translation[2] += this.velocity[2];

            this.velocity[0] += g[0];
            this.velocity[1] += g[1];
            this.velocity[2] += g[2];

            //if the tomato goes out or under the grid it loses the alive status
            if (Math.abs(this.translation[0]) > NUM_X || this.translation[1] < 0 || Math.abs(this.translation[2]) > NUM_Y) {
                this.alive = false;
            }
        };
        tomatoes.push(tomatoNode);
    }

    /**
     * Shoots a tomato from the cannon tip based on the cannon's current world position and orientation.
     */
    function shootTomato() {
        drawScene(currentViewNum == 4 ? (axonometric ? getAxonometric() : getOblique()) : mView);

        let currentView;
        if (currentViewNum == 4) {
            currentView = axonometric ? getAxonometric() : getOblique();
        } else {
            currentView = mView;
        }

        const mModel = mult(inverse(currentView), cannonTipWorldMatrix);

        const p00 = mult(mModel, vec4(0, 0, 0, 1));
        const v00 = mult(mModel, vec4(0, 1, 0, 0));
        const p0 = [p00[0], p00[1], p00[2]];
        const v0 = [v00[0], v00[1], v00[2]];
        const fireSpeed = 0.06;
        const v0_wSpeed = [v0[0] * fireSpeed, v0[1] * fireSpeed, v0[2] * fireSpeed];

        createTomato(p0, v0_wSpeed);
    }

    /**
     * Fires both missiles, setting the fired status as true and setting their speed
     */
    function fireMissiles() {
        for (let missile of globalTank.nodes.missiles) {
            if (!missile.fired) {
                missile.fired = true;
                missile.speed = 0.05;
            }
        }
    }


    /**
     * Supports 'h' command, which toggles the side list of commands in the interface.
     */
    function toggleH() {
        const overlay2 = document.getElementById("overlay2");
        overlay2.classList.toggle("hidden");
    }

    /**
     * Sets the front view.
     */
    function view1() {
        mView = lookAt(FRONT_VIEW[0], FRONT_VIEW[1], FRONT_VIEW[2]);
        currentViewNum = 1;
    }

    /**
     * Sets the left view.
     */
    function view2() {
        mView = lookAt(LEFT_VIEW[0], LEFT_VIEW[1], LEFT_VIEW[2]);
        currentViewNum = 2;
    }

    /**
     * Sets the top view.
     */
    function view3() {
        mView = lookAt(TOP_VIEW[0], TOP_VIEW[1], TOP_VIEW[2]);
        currentViewNum = 3;
    }

    /**
     * Sets the 4th view.
     */
    function view4() {
        mView = axonometric ? getAxonometric() : getOblique();
        currentViewNum = 4;
    }


    /**
     * Moves the tank forward.
     */
    function tankFront() {
        const deltaQ = -0.01;
        tankMov = Math.max(tankMov + deltaQ, -X_LIMIT);
        tank.translation[0] = tankMov;
        updateWheelRotation(deltaQ);
    }

    /**
     * Moves the tank backwards.
     */
    function tankBack() {
        const deltaE = 0.01;
        tankMov = Math.min(tankMov + deltaE, X_LIMIT);
        tank.translation[0] = tankMov;
        updateWheelRotation(deltaE);
    }


    /**
     * Moves the cannon up.
     */
    function cannonUp() {
        cannonAngle = Math.max(cannonAngle - 1, CANNON_ANGLE_MIN);
        cannonSuppNode.rotation[2] = cannonAngle;
    }

    /**
     * Moves the cannon down.
     */
    function cannonDown() {
        cannonAngle = Math.min(cannonAngle + 1, CANNON_ANGLE_MAX);
        cannonSuppNode.rotation[2] = cannonAngle;
    }

    /**
     * Rotates the cabin left.
     */
    function cabinLeft() {
        cabinRotationAngle += 1;
        cabin.rotation[1] = cabinRotationAngle;
    }

    /**
     * Rotates the cabin right.
     */
    function cabinRight() {
        cabinRotationAngle -= 1;
        cabin.rotation[1] = cabinRotationAngle;
    }

    /**
    * Resets view params and the zoom
    */
    function resetValues() {
        theta = 0;
        gamma = 0;
        l = 0.5;
        zoomRadius = 1.8;
    }

    //The tank is initialized and some relevant parts of it are set here.
    globalTank = createTank(gl, program, mode, uploadModelView);
    let cannonSuppNode = globalTank.nodes.cannonSupp;
    let cabin = globalTank.nodes.cabin;
    let tank = globalTank.root;
    let tip = globalTank.nodes.cannonTip;
    let missiles = globalTank.nodes.missiles;


    /**
     * Fires both missiles, setting the fired status as true and setting their speed.
     */
    function fireMissiles() {
        for (let missile of missiles) {
            if (!missile.fired) {
                missile.fired = true;
                missile.speed = 0.05;
            }
        }
    }

    /**
     * Reloads both missiles at their respective support, so they can be fired again.
     */
    function reloadMissiles() {
        for (let missile of missiles) {
            missile.fired = false;
            missile.translation = missile.initialTranslation.slice();
        }
    }

    /**
     * Supports all the available commands.
     * @param {*} event - keyboard keydown
     */
    document.onkeydown = function (event) {
        switch (event.key) {
            case "h":
                toggleH();
                break;
            case '1':
                view1();
                break;
            case '2':
                view2();
                break;
            case '3':
                view3();
                break;
            case '4':
                view4();
                break;
            case ' ':
                mode = (mode == gl.LINES) ? gl.TRIANGLES : gl.LINES;
                break;
            case '0':
                gridview = !gridview;
                break;
            case '8':
                if (currentViewNum != 4) { break; }
                else if (currentViewNum == 4 && !parallel) { axonometric = true; break; }
                axonometric = !axonometric;
                break;
            case '9':
                if (currentViewNum == 4 && !axonometric) { break; }
                parallel = !parallel;
                break;
            case 'ArrowLeft':
                theta--;
                break;
            case 'ArrowRight':
                theta++;
                break;
            case 'ArrowUp':
                gamma++;
                break;
            case 'ArrowDown':
                gamma--;
                break;
            case "w":
                cannonUp();
                break;
            case "s":
                cannonDown();
                break;
            case "a":
                cabinLeft();
                break;
            case "d":
                cabinRight();
                break;
            case 'q':
                tankFront();
                break;
            case 'e':
                tankBack();
                break;
            case 'z':
                shootTomato();
                break;
            case 'f':
                fireMissiles();
                break;
            case 'g':
                reloadMissiles();
                break;
            case 'r':
                resetValues();
                break;
        }
    }

    //event listener that supports the scroll wheel.
    document.addEventListener("wheel", (event) => {
        if (event.deltaY > 0) {
            zoomRadius += 0.05;
        }
        else {
            zoomRadius -= 0.05;
        }
        zoomRadius = Math.max(1, Math.min(zoomRadius, 10));
    });

    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.enable(gl.DEPTH_TEST);

    window.requestAnimationFrame(render);


    /**
     * Function that gets the view matrix by computing gamma and theta in spherical coordinates to get the camera view.
     * @returns the camera view.
     */
    function getCamera() {
        const x = (zoomRadius * Math.cos(gamma * Math.PI / 180) * Math.sin(theta * Math.PI / 180));
        const y = (zoomRadius * Math.sin(gamma * Math.PI / 180));
        const z = (zoomRadius * Math.cos(gamma * Math.PI / 180) * Math.cos(theta * Math.PI / 180));

        return lookAt(
            [x, y + 0.6, z],
            [0, 0.6, 0],
            [0, 1, 0]
        );
    }

    /**
     * Returns the oblique projection matrix by applying a transformation to the current camera view.
     * @returns oblique
     */
    function getOblique() {
        const cam = getCamera();
        let m = mat4(
            1, 0, -l * Math.cos(theta * Math.PI / 180), 0,
            0, 1, -l * Math.sin(theta * Math.PI / 180), 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
        loadMatrix(cam);
        multMatrix(m);
        return modelView();
    }

    /**
     * Calls getCamera() with a fancier name.
     * @returns the camera view.
     */
    function getAxonometric() {
        return getCamera();
    }

    /**
     * Draws the checkered pattern ground with NUM_X depth and NUM_Y width, with the close to black and close to white colors.
     */
    function drawGround() {
        for (let i = -NUM_X / 2; i < NUM_X / 2; i++) {
            for (let j = -NUM_Y / 2; j < NUM_Y / 2; j++) {
                pushMatrix();

                multTranslation([i * TILE_SIZE, 0, j * TILE_SIZE]);
                multScale([TILE_SIZE, 0.05, TILE_SIZE]);
                multTranslation([0.5, -0.5, 0.5]);

                const color = ((i + j) % 2 == 0) ? [0.7, 0.7, 0.7, 1.0] : [0.3, 0.3, 0.3, 1.0];

                gl.uniform4fv(gl.getUniformLocation(program, "u_color"), color);
                uploadModelView();
                CUBE.draw(gl, program, mode);

                popMatrix();
            }
        }
    }

    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Sends the projection matrix to the shader.
    function uploadProjection() {
        uploadMatrix("u_projection", mProjection);
    }

    // Sends the modelView matrix to the shader.
    function uploadModelView() {
        uploadMatrix("u_model_view", modelView());
    }

    //Sends a matrix value to the shader as a uniform
    function uploadMatrix(name, mode) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(mode));
    }

    /**
     * Sets the view matrix, draws the ground and the tank, and updates the cannon tip's world matrix.
     * @param {mat4} viewMatrix - view matrix.
     */
    function drawScene(viewMatrix) {
        loadMatrix(viewMatrix);
        drawGround();
        globalTank.root.draw(gl, program, mode, uploadModelView);
        cannonTipWorldMatrix = tip.worldMatrix;
    }

    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        let perspectiveMatrix = perspective(FOV * zoomRadius, aspect, NEAR * zoomRadius, FAR * zoomRadius);
        let orthoMatrix = ortho(-aspect * zoomRadius, aspect * zoomRadius, -zoomRadius, zoomRadius, NEAR * zoomRadius, FAR * zoomRadius);

        if (parallel) {
            mProjection = orthoMatrix;
        } else {
            mProjection = perspectiveMatrix;
        }

        uploadProjection(mProjection);

        /**
         * Updates and draws all tomatoes in the tomatoes array, removing any that are no longer alive.
         */
        function showTomatoes() {
            for (let i = tomatoes.length - 1; i >= 0; i--) {
                const t = tomatoes[i];
                t.update();
                pushMatrix();
                multTranslation(t.translation);
                multScale(t.scale);
                t.draw(gl, program, mode, uploadModelView);
                popMatrix();

                if (!t.alive) {
                    tomatoes.splice(i, 1);
                }
            }
            uploadProjection(mProjection);
        }

        /**
         * Updates the status of each of the missiles, applying the movement logic if the fired status is true, and 
         * setting it false if a certain distance is covered by the missile.
         */
        function updateMissiles() {
            for (let missile of globalTank.nodes.missiles) {
                if (missile.fired) {
                    missile.translation[0] -= missile.speed;
                    if (missile.translation[0] < -3) {
                        missile.fired = false;
                        missile.translation = [999, 999, 999];
                    }
                }
            }
        }

        //GRIDVIEW
        if (gridview) {
            const hw = canvas.width / 2;
            const hh = canvas.height / 2;

            gl.viewport(0, hh, hw, hh);
            mView = lookAt(FRONT_VIEW[0], FRONT_VIEW[1], FRONT_VIEW[2]);
            uploadProjection(mProjection);
            drawScene(mView);
            showTomatoes();
            updateMissiles();

            gl.viewport(0, 0, hw, hh);
            mView = lookAt(LEFT_VIEW[0], LEFT_VIEW[1], LEFT_VIEW[2]);
            uploadProjection(mProjection);
            drawScene(mView);
            showTomatoes();
            updateMissiles();

            gl.viewport(hw, hh, hw, hh);
            mView = lookAt(TOP_VIEW[0], TOP_VIEW[1], TOP_VIEW[2]);
            uploadProjection(mProjection);
            drawScene(mView);
            showTomatoes();
            updateMissiles();

            gl.viewport(hw, 0, hw, hh);
            if (axonometric) {
                drawScene(getAxonometric());
                showTomatoes();
                updateMissiles();

            } else {
                uploadProjection(orthoMatrix);
                drawScene(getOblique());
                showTomatoes();
                updateMissiles();
            }
            //NO GRIDVIEW
        } else {
            gl.viewport(0, 0, canvas.width, canvas.height);
            if (currentViewNum == 4) {
                if (axonometric) {
                    drawScene(getAxonometric());
                    showTomatoes();
                    updateMissiles();
                } else {
                    uploadProjection(orthoMatrix);
                    drawScene(getOblique());
                    showTomatoes();
                    updateMissiles();
                }
            } else {
                drawScene(mView);
                showTomatoes();
                updateMissiles();
            }
        }
    }
}
const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))