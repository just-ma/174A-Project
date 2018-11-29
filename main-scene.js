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

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

        this.x = 0;
        this.y = 0;
        this.px = 0;
        this.py = 0;
        this.x_last = 0;
        this.y_last = 0;
        this.vi = Vec.of(0,8,0);
        this.time_last = 0;
        this.velocity = Vec.of(0,0,0);
        this.grounded = false;
      }
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
    make_control_panel()
      { this.key_triggered_button( "flip", [ "a" ], this.flip );
        this.key_triggered_button( "flip2", [ "d" ], this.flip2 );
      }
    check_collisions()
      { if (this.y < -2){
            this.velocity[0] *= 0.8;
            this.velocity[1] *= -0.8;
            this.y = -2;
            this.add_force( Vec.of(0,0,0) );
        }
      }  
    display( graphics_state )
      { graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        this.time = t;

        //set new positions
        this.px = this.x;
        this.py = this.y

        this.x = (t - this.time_last) * this.vi[0] + this.x_last;
        this.y = Math.pow(t - this.time_last,2) * -9.8 + (t - this.time_last) * this.vi[1] + this.y_last;
        
        this.velocity = Vec.of(50*(this.x - this.px), 50*(this.y - this.py), 0);
        

        //check for collisions 
        this.check_collisions();

        
        //draw objects
        let ground = Mat4.identity().times( Mat4.translation([ 0, -3, -4 ]) )
                                    .times( Mat4.scale([ 5, 0.1, 2 ]) )
                                    
        this.shapes.box.draw( graphics_state, ground, this.materials.phong );

        let ball_transform = Mat4.identity().times(Mat4.translation([ this.x, this.y, -4 ]) )
        this.shapes.ball.draw( graphics_state, ball_transform, this.materials.phong );
      }
  }