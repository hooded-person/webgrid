class pathfindingAi {
	constructor() {
		this.path = [];
		this.pathMeta = {
			startX: null,
			startY: null,
			goalX: null,
			goalY: null,
		};
	}
	_find(entity, target) {
		this.pathMeta = {
			startX: entity.x,
			startY: entity.y,
			goalX: target.x,
			goalY: target.y,
		};
	}
	_move(entity, step) {
		let result = entity.move(...step);
		if (this.path.length > 0) {
			this.pathMeta.startX = result.x;
			this.pathMeta.startY = result.y;
		} else if (result.x != this.pathMeta.goalX || result.y != this.pathMeta.goalY) {
			this.pathMeta = {
				startX: null,
				startY: null,
				goalX: null,
				goalY: null,
			};
		}
	}

	
	assureFound(entity, target) {
		let matching = this.pathMeta.startX == entity.x
			&& this.pathMeta.startY == entity.y
			&& this.pathMeta.goalX == target.x
			&& this.pathMeta.goalY == target.y;
		if (matching) {
			return true;
		} else {
			return this.find(entity, target);
		}
	}
	find(entity, target) {
		this.path = [];
		if (entity.x == target.x && entity.y == target.y) {
			this._find(entity, target);
			return true;
		}
		
		this.path.push([target.x - entity.x, target.y - entity.y]);
		
		this._find(entity, target);
		return true;
	}
	move(entity, amount = 1) {
		console.log("moving");
		console.log(this.path);
		for (let i = 0;i<amount;i++) {
			let step = this.path.shift()
			if (step) {
				this._move(entity, step);
			}
		}
	}
}

class TwoWayAi extends pathfindingAi {
	constructor(prio = "x") {
		super();
		this.prio = prio;
	}
	find(entity, target) {
		if (this.prio == "y") {
			this._find_yx(entity, target);
		} else {
			this._find_xy(entity, target);
		}
		this._find(entity, target); // method defined by the super;
	}

	_find_xy(entity, target) {
		let x = entity.x;
		let y = entity.y;
		let tx = target.x;
		let ty = target.y;
		this.path = [];
		if (x < tx) {
			this.path.push([1, 0])
		} else if (x > tx) {
			this.path.push([-1, 0])
		} else if (y < ty) {
			this.path.push([0, 1])
		} else if (y > ty) {
			this.path.push([0, -1])
		}
	}
	_find_yx(entity, target) {
		let x = entity.x;
		let y = entity.y;
		let tx = target.x;
		let ty = target.y;
		this.path = [];
		while (x != tx || y != ty) {
			if (y < ty) {
				this.path.push([0, 1]);
				y += 1;
			} else if (y > ty) {
				this.path.push([0, -1]);
				y -= 1;
			} else if (x < tx) {
				this.path.push([1, 0]);
				x += 1;
			} else if (x > tx) {
				this.path.push([-1, 0]);
				x -= 1;
			}
		}
	}
};
class DiagAi extends pathfindingAi {
	constructor() {
		super();
	}
	find(entity, target) {
		let xDif = Math.abs(target.x - entity.x);
		let yDif = Math.abs(target.y - entity.y);
		this.path = [];
		while (xDif != 0 || yDif != 0) {
			this.path.push([Math.sign(xDif), Math.sign(yDif)]);
			xDif -= Math.sign(xDif);
			yDif -= Math.sign(yDif);
		}
		this._find();
	}
}

class AstarAi extends pathfindingAi {
	constructor() {
		super();
		this._toDo = [];
		this.processed = [];
		this.itter = 0;
		this.visMap = [];
	}
	get toDo() {
		this._toDo.sort(); 
		return this._toDo; 
	}
	set toDo(v) {
		this._toDo = v;
	}
	_updateVisMap(x,y,v) {
		if (!this.visMap[y] instanceof Array) {
			this.visMap[y] = []
		}
		this.visMap[y][x] = v
	}
	distance(from, to) {
		let distX = to.x - from.x
		let distY = to.y - from.y
		return Math.sqrt(distX
	}
	
	find(entity, target) {
		this.toDo = entity.tile.neighbors;
		this.processed = [];
		this.itter = 0;
		
		while (this.toDo.length > 0) {
			let current = this.toDo[0];
			
			if (current.x == target.x && current.y == target.y) { // TODO, this will never match rn
				alert("found path")
			}
			
			this.ai.toDo.shift();

			current.neighbors.forEach( (neigbor) => {
				score = 
			});
		}
	}
}


// OLD CODE
// ai_yx() {
// 		let player = this;
// 		let target = this.set.get("target0");
// 		if (player.y < target.y) {
// 			logIfError(player.move(0,1));
// 		} else if (player.y > target.y) {
// 			logIfError(player.move(0,-1));
// 		} else if (player.x < target.x) {
// 			logIfError(player.move(1,0));
// 		} else if (player.x > target.x) {
// 			logIfError(player.move(-1,0));
// 		}
// 	}
// 	ai_xy() {
// 		let player = this;
// 		let target = this.set.get("target0");
// 		console.log(`${this.x}, ${this.y}\n${this.x}, ${this.y}`);
// 		console.log(player.x < target.x, player.x > target.x, player.y < target.y, player.y > target.y);
// 		if (this.x < target.x) {
// 			logIfError(this.move(1,0));
// 		} else if (this.x > target.x) {
// 			logIfError(this.move(-1,0));
// 		} else if (this.y < target.y) {
// 			logIfError(this.move(0,1));
// 		} else if (this.y > target.y) {
// 			logIfError(this.move(0,-1));
// 		}
// 	}
// 	ai_diag() {
// 		let player = this;
// 		let target = this.set.get("target0");
// 		let xDif = Math.abs(target.x - player.x);
// 		let yDif = Math.abs(target.y - player.y);
// 		if (xDif != 0 || yDif != 0) {
// 			if (xDif >= yDif) {
// 				if (player.x < target.x) {
// 					player.move(1,0);
// 				} else if (player.x > target.x) {
// 					player.move(-1,0);
// 				}
// 			} else {
// 				if (player.y < target.y) {
// 					player.move(0,1);
// 				} else if (player.y > target.y) {
// 					player.move(0,-1);
// 				}
// 			}
// 		}
// 	}
// 	ai_Astar() {
		
// 	}