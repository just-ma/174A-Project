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
        
        this.ball_radius = 1;
        this.min_vel_possible_before_zero = 0.0001;
        this.min_vel_for_bounce = 0.05;
        this.bounce_damping_constant = 0.6;

        // Piston
        this.piston_pos = 0; // current piston position
        this.piston_t = 0;   // piston time used for animation

        // Map Objects (static)
        this.map_objs = [
            //                         (position)           (sccale)
            new Map_GameObject(Vec.of( 0, -3, -4 ), Vec.of( 5, 1, 2 )),
            new Map_GameObject(Vec.of( 3, 0, -4 ), Vec.of( 1, 5, 2 )),
        ] 
        // Piston Objects (static)
        this.piston_objs = [
            //                           (position)     (rotation)
            new Piston_GameObject(Vec.of( 2, 0, -4 ), Math.PI / 6),
            new Piston_GameObject(Vec.of( -6, 3, -4 ), -Math.PI / 2)

        ]

      }
    //////////////////////////////////////////////////////////
    // Piston Functions
    piston_push(){
        this.piston_t = 10;
    }
    piston_function( x ){
        if (x > 6){
            this.piston_pos = 5 - 0.5 * x;
        } else {
            this.piston_pos = x/3;
        }
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

        if (this.velocity < this.min_vel_possible_before_zero)
            this.velocity = 0;
    }
    check_collision(map_obj, ball_max_x, ball_min_x, ball_max_y, ball_min_y, ball_vel_x, ball_vel_y, ball_vel_mag)
      { /*
        if (this.y < -2){
            this.velocity[0] *= 0.8;
            this.velocity[1] *= -0.8;
            this.y = -2;
            this.add_force( Vec.of(0,0,0) );
        }*/

        var dont_flip_x_dir_sign = 1; // 1 means don't flip
        var dont_flip_y_dir_sign = 1; // 1 means don't flip
        
        // Bools describing whether each edge of the ball overlaps with this map_obj
        var bottom_overlap = (ball_min_y < map_obj.max_y && ball_min_y > map_obj.min_y);
        var top_overlap = (ball_max_y < map_obj.max_y && ball_max_y > map_obj.min_y);
        var left_overlap = (ball_min_x < map_obj.max_x && ball_min_x > map_obj.min_x);
        var right_overlap = (ball_max_x < map_obj.max_x && ball_max_x > map_obj.min_x);
       
        
        // BOUNCE REVERSE: Checking for FULL OVERLAP of ball inside map platform
        if (bottom_overlap && top_overlap && right_overlap && left_overlap)
          {
            dont_flip_x_dir_sign = -1;
            dont_flip_y_dir_sign = -1;
            // Don't know where to reset position to
          }
        // BOUNCE to UP: Bottom of ball is overlapping
        if (bottom_overlap && !top_overlap && ball_vel_y < 0 &&
            ((ball_max_x < map_obj.max_x && ball_max_x > map_obj.min_x) || (ball_min_x < map_obj.max_x && ball_min_x > map_obj.min_x))) // checking within x-range
          {
            dont_flip_x_dir_sign = 1;
            dont_flip_y_dir_sign = -1;
            this.y = ball_vel_y < 0 ? map_obj.max_y + this.ball_radius : map_obj.min_y - this.ball_radius;
            console.log("overlap bot");
          }
        // BOUNCE to DOWN: Top of ball is overlapping
        else if (top_overlap && !bottom_overlap && ball_vel_y > 0 &&
            ((ball_max_x < map_obj.max_x && ball_max_x > map_obj.min_x) || (ball_min_x < map_obj.max_x && ball_min_x > map_obj.min_x))) // checking within x-range
          {
            dont_flip_x_dir_sign = 1;
            dont_flip_y_dir_sign = -1;
            this.y = ball_vel_y < 0 ? map_obj.max_y + this.ball_radius : map_obj.min_y - this.ball_radius;
            console.log("overlap top");
          }
        // BOUNCE to the RIGHT: Left of ball is overlapping
        else if (left_overlap && !right_overlap &&
            ((ball_max_y < map_obj.max_y && ball_max_y > map_obj.min_y) || (ball_min_y < map_obj.max_y && ball_min_y > map_obj.min_y))) // checking within y-range
          {
            dont_flip_x_dir_sign = -1;
            dont_flip_y_dir_sign = 1;
            this.x = ball_vel_x < 0 ? map_obj.max_x + this.ball_radius : map_obj.min_x - this.ball_radius;
            console.log("overlap left");
          }
        // BOUNCE to the LEFT: Right of ball is overlapping
        else if (right_overlap && !left_overlap &&
            ((ball_max_y < map_obj.max_y && ball_max_y > map_obj.min_y) || (ball_min_y < map_obj.max_y && ball_min_y > map_obj.min_y))) // checking within y-range
          {
            dont_flip_x_dir_sign = -1;
            dont_flip_y_dir_sign = 1;
            this.x = ball_vel_x < 0 ? map_obj.max_x + this.ball_radius : map_obj.min_x - this.ball_radius;
            console.log("overlap right");
          }
        else // could not collide
          return false;
        
        // Did collide, so modify velocity (position was already reset)
        if (ball_vel_mag > this.min_vel_for_bounce)
        {
            this.velocity[0] *= dont_flip_x_dir_sign * this.bounce_damping_constant;
            this.velocity[1] *= dont_flip_y_dir_sign * this.bounce_damping_constant;
            this.add_force( Vec.of(0,0,0) ); // Update current movement with our new velocity
        }
      }  
    check_all_collisions()
      {
        var ball_vel_x = this.velocity[0];
        var ball_vel_y = this.velocity[1];
        var ball_vel_mag = Math.sqrt(ball_vel_x * ball_vel_x + ball_vel_y * ball_vel_y);
        if (ball_vel_mag == 0)
            return;

        var ball_max_x = this.x + this.ball_radius;
        var ball_min_x = this.x - this.ball_radius;
        var ball_max_y = this.y + this.ball_radius;
        var ball_min_y = this.y - this.ball_radius;
        
        var collided = false;
        
        var i;
        for (i = 0; i < this.map_objs.length; i++)
         {
            this.check_collision(this.map_objs[i], ball_max_x, ball_min_x, ball_max_y, ball_min_y, ball_vel_x, ball_vel_y, ball_vel_mag);
            collided = (ball_vel_x != this.velocity[0] && ball_vel_y != this.velocity[1]);
            if (collided)
             break;
         }
      }
    //////////////////////////////////////////////////////////
    // Buttons
    make_control_panel()
      { this.key_triggered_button( "flip", [ "a" ], this.flip );
        this.key_triggered_button( "flip2", [ "d" ], this.flip2 );
        this.key_triggered_button( "piston", [ "w" ], this.piston_push );

      }
    //////////////////////////////////////////////////////////
    // Draw Objects
    draw_objects(graphics_state, box_objs, piston_objs, ball_transform)
      {
        var i;
        for (i = 0; i < box_objs.length; i++)
          this.shapes.box.draw( graphics_state, box_objs[i].model_transform, this.materials.phong );

        if (this.piston_t > 0){
            this.piston_t--;
            this.piston_function(this.piston_t);
        }

        for (i = 0; i < piston_objs.length; i++){
          let temp_transform = piston_objs[i].model_transform.times(Mat4.translation([ 0, this.piston_pos, 0 ]));
          this.shapes.box.draw( graphics_state, temp_transform, this.materials.phong );
        }
                
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
        this.draw_objects(graphics_state, this.map_objs, this.piston_objs, ball_transform);
       
        //update camera
        this.update_camera(graphics_state, ball_transform);
      }
  }
