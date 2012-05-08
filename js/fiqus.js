var directions = [
[-1, 1],
[-1, 0],
[-1,-1],
[ 0,-1],
[ 1,-1],
[ 1, 0],
[ 1, 1]
]

$(function() {

	var nLines = 7;
	var branchWidth = 4;
	var branchDistance = 4;
	var w = 640;
	var h = 480;

	var grid_size = 15;

	var trunk_len = 10;

	var turning_chances = 0.2;
	var splitting_chances = 0.5;

	var canvas = document.getElementById("canvas");
	if (canvas.getContext) {
		var ctx = canvas.getContext("2d");
		
		grid_total_width = Math.floor(w / grid_size) * grid_size;
		grid_total_height = Math.floor(h / grid_size) * grid_size;

		base_x = w/2 - grid_total_width/2;
		base_y = h/2 - grid_total_height/2;

		rows = grid_total_height/grid_size;
		cols = grid_total_width/grid_size;

		radius = Math.abs(Math.min(cols+1, rows+1)/2.2);
		center = [(cols + 1 )/ 2, (rows + 1)/2];

		/*ctx.lineWidth = 1;

		for(var i = 0; i <= grid_total_width/grid_size; i++){
			ctx.beginPath();
			ctx.moveTo(base_x + i*grid_size,base_y);
			ctx.lineTo(base_x + i*grid_size,base_y + grid_total_height);
			ctx.stroke();
		}

		for(i = 0; i <= grid_total_height/grid_size; i++){
			ctx.beginPath();
			ctx.moveTo(base_x, base_y + i*grid_size);
			ctx.lineTo(base_x + grid_total_width, base_y + i*grid_size);
			ctx.stroke();
		}
		*/
		ctx.lineWidth = branchWidth;

		//inicializo la matriz;
		matrix = [];
		for(i=0;i<cols+1;i++){
			matrix[i] = [];
			for(j=0;j<rows+1;j++){
			}
		}

		puntos = [];
		for(i=0;i<nLines;i++){
			var p = [cols - Math.floor((cols+1)/2) - Math.floor(nLines/2) + i , rows-2 ];
			puntos.push(p);
			matrix[p[0]][p[1]] = 3; //direccion para arriba

		}

		var can_draw = function(point_from, n_direction) {
			if(n_direction < 0){
				return false;
			}if(n_direction >= directions.length){
				return false;
			}

			var next_point = [point_from[0] + directions[n_direction][0],point_from[1] + directions[n_direction][1]];
			if(next_point[0] < 0 || next_point[0] > cols){
				return false;
			}
			if(next_point[1] < 0 || next_point[1] > rows+1){
				return false;
			}
			if(matrix[next_point[0]][next_point[1]] !== undefined){
				return false;
			}
			if(Math.sqrt(Math.pow(center[0] - next_point[0],2) + Math.pow(center[1] - next_point[1],2)) > radius){
				return false;
			}
			var dir = directions[n_direction];
			if(Math.abs(dir[0])> 0 && Math.abs(dir[1])> 0){ //si es diagonal
				op_1 = [point_from[0] + dir[0], point_from[1]];
				op_2 = [point_from[0], point_from[1] + dir[1]];

				if(matrix[op_1[0]] !== undefined && matrix[op_1[0]][op_1[1]] !== undefined){
					var op1_dir = directions[matrix[op_1[0]][op_1[1]]];
					if(op_1[0] + op1_dir[0] == op_2[0] && op_1[1] + op1_dir[1] == op_2[1]){
						return false;
					}
				}
				if(matrix[op_2[0]] !== undefined && matrix[op_2[0]][op_2[1]] !== undefined){
					var op2_dir = directions[matrix[op_2[0]][op_2[1]]];
					if(op_2[0] + directions[matrix[op_2[0]][op_2[1]]][0] == op_1[0] && op_2[1] + directions[matrix[op_2[0]][op_2[1]]][1] == op_1[1]){
						return false;
					}
				}
			}

			return true;
		};

		var get_checked_direction = function(point_from, n_direction){
			var possible_directions = [];
			if(Math.random() < turning_chances){
				if(Math.random() < 0.5){
					possible_directions = [n_direction+1, n_direction-1, n_direction];
				}else{
					possible_directions = [n_direction-1, n_direction+1, n_direction];
				}
			}else{
				if(Math.random() < 0.5){
					possible_directions = [n_direction, n_direction-1, n_direction+1];
				}else{
					possible_directions = [n_direction, n_direction+1, n_direction-1];
				}
			}
			console.debug(possible_directions);
			for (var i = 0; i < possible_directions.length; i++) {
				if(can_draw(point_from, possible_directions[i])){
					return possible_directions[i];
				}
			}
			return;
		};

		var drawing = true;
		var n = 0;
		while (drawing){ //los primeros sigo para arriba el tronco
			drawing = false;
			var l = puntos.length;
			for (i = 0; i < l; i++) {
				var punto_prev = puntos[i];
				if(!punto_prev){
					continue;
				}
				var direccion = matrix[punto_prev[0]][punto_prev[1]];

				if(n == trunk_len){ //termine el tronco, hago que se abran las ramas
					if(i < puntos.length/3 - 1){
						direccion = 2;
					}else if(i > 2 * puntos.length/3){
						direccion = 4;
					}
				}else if(n > trunk_len){//las ramas
					direccion = get_checked_direction(punto_prev, direccion);
					if(!direccion){
						puntos[i] = false;
						ctx.beginPath();
						ctx.arc(base_x + grid_size * punto_prev[0],base_y + grid_size * punto_prev[1] , branchWidth, 0, 2*Math.PI);
						ctx.fillStyle = "white";
						ctx.fill();
						ctx.stroke();
						continue;
					}if(Math.random() < splitting_chances){//nueva rama
						puntos.push(punto_prev);
					}
				}

				var dir = directions[direccion];
				var punto_next = [punto_prev[0] + dir[0], punto_prev[1] + dir[1]];

				matrix[punto_next[0]][punto_next[1]] = direccion;
				puntos[i] = punto_next;

				ctx.beginPath();
				ctx.moveTo(base_x + grid_size * punto_prev[0],base_y + grid_size * punto_prev[1]);
				ctx.lineTo(base_x + grid_size * punto_next[0],base_y + grid_size * punto_next[1]);
				ctx.stroke();
				drawing = true;
			}
			n++;
		}
	}
});

