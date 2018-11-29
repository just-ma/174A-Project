window.Scene = window.classes.Scene =
class Scene extends Scene_Component
  { constructor( context, control_box )
      { super(   context, control_box );
        //if( !context.globals.has_controls   ) 
        //  context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { box:   new Cube(),
                         ball:  new Subdivision_Sphere(5)
                       }
        this.submit_shapes( context, shapes );

        this.materials =
          { phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) )
          }

        this.lights = [ new Light( Vec.of( -2,2,2,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

        // Ball (moving)
        this.x = 0; // current x pos
        this.y = 0; // current y pos
        this.z = -4 // locked z pos
        this.px = 0; // previous frame x pos
        this.py = 0; // previous frame y pos
        this.x_last = 0; // new origin x for calculating physics
        this.y_last = 0; // new origin y for calculating physics
        this.vi = Vec.of(0,8,0); // initial velocity
        this.time_last = 0; // resetting time to 0 after adding force
        this.velocity = Vec.of(0,0,0); // current velocity

        // Map Objects (static)
        this.map_objs = [
            //                         (position)           (sccale)
            new Map_GameObject(Vec.of( 0, -3, -4 ), Vec.of( 5, 0.1, 2 )),
            new Map_GameObject(Vec.of( 3, 0, -4 ), Vec.of( .1, 5, 2 )),
        ] 
        this.piston_objs = [

        ]

      }
    //////////////////////////////////////////////////////////
    // Physics Functions
    add_force( force ){
        this.vi[0] = force[0] + this.velocity[0];
        this.vi[1] = force[1] + this.velocity[1];
        this.x_last = this.x;
        this.y_last = this.y;
        this.time_last = this.time;
    }
    flip() {
        this.add_force( Vec.of(-5,10,0) );
      }
    flip2() {
        this.add_force( Vec.of(5,10,0) );
      }
    run_newtonian_physics(t)
    {
        this.time = t;
        this.px = this.x;
        this.py = this.y

        this.x = (t - this.time_last) * this.vi[0] + this.x_last;
        this.y = Math.pow(t - this.time_last,2) * -9.8 + (t - this.time_last) * this.vi[1] + this.y_last;
        
        this.velocity = Vec.of(50*(this.x - this.px), 50*(this.y - this.py), 0);
        
    }
    check_collision()
      { if (this.y < -2){
            this.velocity[0] *= 0.8;
            this.velocity[1] *= -0.8;
            this.y = -2;
            this.add_force( Vec.of(0,0,0) );
        }
      }  
    check_all_collisions()
      {
        this.check_collision();
      }
    //////////////////////////////////////////////////////////
    // Buttons
    make_control_panel()
      { this.key_triggered_button( "flip", [ "a" ], this.flip );
        this.key_triggered_button( "flip2", [ "d" ], this.flip2 );
      }
    //////////////////////////////////////////////////////////
    // Draw Objects
    draw_objects(graphics_state, box_objs, ball_transform)
      {
        var i;
        for (i = 0; i < box_objs.length; i++)
          this.shapes.box.draw( graphics_state, box_objs[i].model_transform, this.materials.phong );
        
        this.shapes.ball.draw( graphics_state, ball_transform, this.materials.phong );
      }
    //////////////////////////////////////////////////////////
    // Update Camera
    update_camera(graphics_state, ball_transform)
      {
        graphics_state.camera_transform = Mat4.look_at( Vec.of( ball_transform[0][3], ball_transform[1][3], ball_transform[2][3] 
                                                                + 10 + Math.abs(this.velocity[0])/2 ), 
                                                        Vec.of( ball_transform[0][3], ball_transform[1][3], ball_transform[2][3] ), 
                                                        Vec.of( 0,1,0 ) )
                                                        .map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.05 ) );
      }
    //////////////////////////////////////////////////////////
    // Update Frame Loop
    display( graphics_state )
      { graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        //set new positions
        this.run_newtonian_physics(t);

        //check for collisions 
        this.check_all_collisions();
        
        //draw objects
        let ball_transform = Mat4.identity().times(Mat4.translation([ this.x, this.y, this.z ]) )
        this.draw_objects(graphics_state, this.map_objs, ball_transform);
       
        //update camera
        this.update_camera(graphics_state, ball_transform);
      }
  }
