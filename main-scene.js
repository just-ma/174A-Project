window.Cube = window.classes.Cube =
class Cube extends Shape                 // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
  { constructor()
      { super( "positions", "normals" ); // Name the values we'll define per each vertex.  They'll have positions and normals.

        // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
        this.positions.push( ...Vec.cast( [-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], [1,1,-1],  [-1,1,-1],  [1,1,1],  [-1,1,1],
                                          [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], [1,-1,1],  [1,-1,-1],  [1,1,1],  [1,1,-1],
                                          [-1,-1,1],  [1,-1,1],  [-1,1,1],  [1,1,1], [1,-1,-1], [-1,-1,-1], [1,1,-1], [-1,1,-1] ) );
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(   ...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
                                          [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
                                          [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1] ) );

                 // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
                 // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
                 // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push( 0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
                          14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22 );
        // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
      }
  }

window.Assignment_One_Scene = window.classes.Assignment_One_Scene =
class Assignment_One_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        const r = context.width/context.height;
        context.globals.graphics_state.    camera_transform = Mat4.translation([ 5,-10,-30 ]);  // Locate the camera here (inverted matrix).
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

       
      }
    display( graphics_state )
      { graphics_state.lights = this.lights;

     
      }
  }