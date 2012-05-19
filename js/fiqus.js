var directions = [[0, 1],[-1, 1], [-1, 0], [-1,-1], [ 0,-1], [ 1,-1], [ 1, 0], [ 1, 1], [0, 1]];
function randOrd(){
	return (Math.round(Math.random())-0.5);
}

    // shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function( callback ){
				window.setTimeout(callback, 1000 / 60);
			};
})();
 

var Branch = function(point, direction){
	this.point = point;
	this.direction = direction;
	this.children = [];
};

var Tree = function(canvas, grid_size, branchWidth, nLines, trunk_len, rad, pos_leaves, turning_chances, splitting_chances, death_chances){
	this.set_canvas(canvas);
	this.grid_size = grid_size;
	this.branchWidth = branchWidth;
	this.nLines = nLines;
	this.trunk_len = trunk_len;
	this.turning_chances = turning_chances;
	this.splitting_chances = splitting_chances;
	this.death_chances = death_chances;
	this.pos_leaves = pos_leaves;

	this.grid_total_width = Math.floor(this.width / this.grid_size) * this.grid_size;
	this.grid_total_height = Math.floor(this.height / this.grid_size) * this.grid_size;

	this.base_x = this.width/2 - this.grid_total_width/2;
	this.base_y = this.height/2 - this.grid_total_height/2;

	this.rows = this.grid_total_height/this.grid_size;
	this.cols = this.grid_total_width/this.grid_size;

	this.radius = Math.abs((Math.min(this.cols+1, this.rows+1)/2) * rad);
	this.center = [(this.cols + 1 )/ 2, Math.abs(this.rows/2 + this.rows*this.pos_leaves/2)];

	this.back_color = 'rgba(0,0,0,0)';
	this.fore_color = '#062202';
};

Tree.prototype.set_canvas = function(c) {
	this.canvas = c;
	this.ctx = c.getContext("2d");
	this.width = c.width;
	this.height = c.height;
};

Tree.prototype.can_draw = function(point_from, n_direction) {
	if(n_direction < 0){
		return false;
	}if(n_direction >= directions.length){
		return false;
	}

	var next_point = [point_from[0] + directions[n_direction][0],point_from[1] + directions[n_direction][1]];
	if(next_point[0] < 0 || next_point[0] > this.cols){
		return false;
	}
	if(next_point[1] < 0 || next_point[1] > this.rows+1){
		return false;
	}
	if(this.matrix[next_point[0]][next_point[1]] !== undefined){
		return false;
	}
	if(Math.sqrt(Math.pow(this.center[0] - next_point[0],2) + Math.pow(this.center[1] - next_point[1],2)) > this.radius){
		return false;
	}
	
	var dir = directions[n_direction];

	if(Math.abs(dir[0])> 0 && Math.abs(dir[1])> 0){ /*si es diagonal*/
		if(this.used_squares[Math.min(point_from[0], next_point[0])][Math.min(point_from[1], next_point[1])]){
			return false;
		}
	}

	return true;
};


Tree.prototype.get_checked_direction = function(point_from, n_direction){
	var possible_directions = [];
	if(Math.random() < this.turning_chances){
		if(Math.random() < 0.5){
			possible_directions = [n_direction+1, n_direction-1, n_direction, n_direction+2, n_direction-2];
		}else{
			possible_directions = [n_direction-1, n_direction+1, n_direction, n_direction-2, n_direction+2];
		}
	}else{
		if(Math.random() < 0.5){
			possible_directions = [n_direction, n_direction-1, n_direction+1, n_direction-2, n_direction+2 ];
		}else{
			possible_directions = [n_direction, n_direction+1, n_direction-1, n_direction+2, n_direction-2];
		}
	}
	for (var i = 0; i < possible_directions.length; i++) {
		if(this.can_draw(point_from, possible_directions[i])){
			return possible_directions[i];
		}
	}
	return;
};

Tree.prototype.new_branch = function(parent, direction){
	var dir = directions[direction];
	var branch = new Branch([parent.point[0] + dir[0], parent.point[1] + dir[1]], direction);
	this.matrix[branch.point[0]][branch.point[1]] = true;
	if(Math.abs(dir[0])> 0 && Math.abs(dir[1])> 0){ /*si es diagonal*/
		this.used_squares[Math.min(parent.point[0], branch.point[0])][Math.min(parent.point[1], branch.point[1])] = true;
	}
	parent.children.push(branch);
	return branch;
};


Tree.prototype.clear = function(){
    this.ctx.fillStyle =this.back_color;
    this.ctx.clearRect(0,0,this.width,this.height);
};
Tree.prototype.stop_animation = function(){
    this.animating = false;
};

Tree.prototype.generate = function() {
	//inicializo la matriz;
	this.matrix = [];
	for(var i=0;i<this.cols+1;i++){
		this.matrix[i] = [];
	}

	this.used_squares = [];
	for(i=0;i<this.cols;i++){
		this.used_squares[i] = [];
	}

	this.generated_tree = [];

	var active_branches = [];
	for(i=0;i<this.nLines;i++){
		var branch = new Branch([this.cols - Math.floor((this.cols+1)/2) - Math.floor(this.nLines/2) + i , this.rows-2 ], 4);
		active_branches.push(branch);
		this.generated_tree.push(branch);
	}

	var n = 0;
	while (active_branches.length > 0){
		var next_active_branches = [];
		var l = active_branches.length;
		for (i = 0; i < l; i++) {
			var curr_branch = active_branches[i];
			var direction = curr_branch.direction;
			if(n<this.trunk_len){
				next_active_branches.push(this.new_branch(curr_branch, direction));
			}
			if(n == this.trunk_len){ /*termine el tronco, hago que se abran las ramas*/
				if(i < active_branches.length/3 - 1){
					next_active_branches.push(this.new_branch(curr_branch, 3));
				}else if(i > 2 * active_branches.length/3){
					next_active_branches.push(this.new_branch(curr_branch, 5));
				}else{
					next_active_branches.push(this.new_branch(curr_branch, direction));
				}
			}else if(n > this.trunk_len){/*las ramas*/
				if(Math.random() > this.death_chances){
					direction = this.get_checked_direction(curr_branch.point, curr_branch.direction);
					if(direction !== undefined){
						next_active_branches.push(this.new_branch(curr_branch, direction));
						if(Math.random() < this.splitting_chances){/*nueva rama*/
							direction = this.get_checked_direction(curr_branch.point, curr_branch.direction);
							if(direction !== undefined){
								next_active_branches.push(this.new_branch(curr_branch, direction));
							}
						}
					}
				}
			}
		}
		active_branches = next_active_branches;
		if(n > this.trunk_len){
			active_branches.sort(randOrd);
		}
		n++;
	}
};

Tree.prototype.draw = function() {
	
	var current_branches = [];
	for (var i = 0; i < this.generated_tree.length; i++) {
		current_branches.push(this.generated_tree[i]);
	}

	this.ctx.fillStyle = this.back_color;
	this.ctx.lineStyle = this.fore_color;

	//this.ctx.fillRect(0,0,this.width,this.height);
	//this.ctx.clearRect(0,0,this.width,this.height);

	var n = 0;
	while(current_branches.length > 0){
		next_branches = [];
		for (i = 0; i < current_branches.length; i++) {
			branch = current_branches[i];
			if(branch.children.length>0){
				for (var j = 0; j < branch.children.length; j++) {
					child = branch.children[j];
					
					next_branches.push(child);
					
					this.ctx.beginPath();
					this.ctx.moveTo(this.base_x + this.grid_size * branch.point[0],this.base_y + this.grid_size * branch.point[1]);
					this.ctx.lineTo(this.base_x + this.grid_size * child.point[0],this.base_y + this.grid_size * child.point[1]);
					this.ctx.strokeStyle = this.fore_color;
					if(n < this.trunk_len/3){
						this.ctx.lineWidth = this.branchWidth * 2;
					}else{
						this.ctx.lineWidth = this.branchWidth;
					}
					this.ctx.stroke();
				}
			}else{
				this.ctx.beginPath();
				this.ctx.arc(this.base_x + this.grid_size * branch.point[0],
								this.base_y + this.grid_size * branch.point[1],
								this.branchWidth, 0, 2*Math.PI);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
		current_branches = next_branches;
		current_branches.sort(randOrd);
		n++;
	}
};


Tree.prototype.animate = function() {
	this.animating = true;
	var current_branches = [];
	for (var i = 0; i < this.generated_tree.length; i++) {
		current_branches.push(this.generated_tree[i]);
	}

	this.ctx.fillStyle = this.back_color;
	this.ctx.lineStyle = this.fore_color;

	//this.ctx.clearRect(0,0,this.width,this.height);

	var n = 0;
	//while(current_branches.length > 0){
	var that = this;
	var pending_branches = [];
	(function animLoop(){
		if(!that.animating){
			return;
		}
		var next_branches = [];
		for (i = 0; i < current_branches.length; i++) {
			var branch = current_branches[i];
			if(branch.children.length>0){
				for (var j = 0; j < branch.children.length; j++) {
					var child = branch.children[j];
					if(n < that.trunk_len || Math.random() < 0.7){
						next_branches.push(child);
					}else{
						pending_branches.push(child);
					}
						that.ctx.beginPath();
						that.ctx.moveTo(that.base_x + that.grid_size * branch.point[0],that.base_y + that.grid_size * branch.point[1]);
						that.ctx.lineTo(that.base_x + that.grid_size * child.point[0],that.base_y + that.grid_size * child.point[1]);
						that.ctx.strokeStyle = that.fore_color;
						if(n < that.trunk_len/3){
							that.ctx.lineWidth = that.branchWidth * 2;
						}else{
							that.ctx.lineWidth = that.branchWidth;
						}
						that.ctx.stroke();

				}
			}else{
				that.ctx.beginPath();
				that.ctx.arc(that.base_x + that.grid_size * branch.point[0],
								that.base_y + that.grid_size * branch.point[1],
								that.branchWidth, 0, 2*Math.PI);
				that.ctx.fill();
				that.ctx.stroke();
			}
		}

		var cant_ramas_animadas = 7;
		if(next_branches.length < cant_ramas_animadas){
			for(var cant = 0; cant < Math.min(pending_branches.length, cant_ramas_animadas);cant++){
				next_branches.push(pending_branches.sort(randOrd).pop());
			}
		}
		current_branches = next_branches;
		current_branches.sort(randOrd);
		n++;
		if(current_branches.length > 0){
			requestAnimFrame(animLoop);
		}
	})();
	//}
};