
## Project

Interactive WebGL application developed for the Computer Graphics and Interfaces course at NOVA FCT, featuring a **tomato-launching tank**.  
The tank is built using **hierarchical modelling** and rendered with multiple camera views and projection modes.



## Features

- Tank model organised as a **scene graph** (`sceneNode`)
- Articulated parts:
  - Rotating cabin
  - Elevating cannon with angle limits
  - Rotating wheels linked to tank movement
- **Single-view** and **four-view (grid)** rendering
- **Orthographic** and **perspective** projections
- **Axonometric** and **oblique** views with adjustable parameters
- Mouse wheel zoom
- Chequered ground plane
- Tomato projectiles with gravity (Euler integration)
- Missile firing and reloading system



## Controls

### Tank & Weapons
- `q` / `e` — Move tank (updates wheel rotation)
- `a` / `d` — Rotate cabin
- `w` / `s` — Move cannon up / down
- `z` — Shoot tomato
- `f` — Fire missiles
- `g` — Reload missiles

### Views & Rendering
- `1` — Front view  
- `2` — Left view  
- `3` — Top view  
- `4` — Axonometric / Oblique view  
- `0` — Toggle grid (4 views)  
- `8` — Axonometric ⇆ Oblique (view 4)
- `9` — Orthographic ⇆ Perspective
- Arrow keys — Adjust camera / projection parameters
- Mouse wheel — Zoom
- `Space` — Wireframe ⇆ Solid
- `r` — Reset view and zoom
- `h` — Toggle help overlay



## Implementation Notes

- Written in **JavaScript** using **WebGL**
- No external libraries beyond the provided utilities
- Scene graph transformations follow:

  **T · Rz · Ry · Rx · S**

- Cannon tip world coordinates are extracted from the scene graph to compute projectile launch position and direction.

---