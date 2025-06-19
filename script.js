/*jshint esversion: 6 */

console.log("running script.js");

let sessionCount = localStorage.getItem("sessionCount");
sessionCount = sessionCount ? sessionCount : 0;
sessionCount++;
console.log(`session ${sessionCount}`);
if (sessionCount <= 1){
	console.warn("This is most likely the first page load. If it is not then the page is unable to access localStorage (this is a problem)");
}
localStorage.setItem("sessionCount", sessionCount);

if (/debug=true/.test(window.location)) {
	window.debug=true;
}
console.log(`debug mode: ${window.debug?"enabled":"disabled"}`);

function assert(statement, msg) {
	if (!statement) {
		console.error(msg);
		throw new Error(msg);
	}
}

function logIfError(result, forceTrace) {
	if (result.success == false) {
		console.warn(result.detailed ? result.detailed : (result.message ? result.message : "An operation failed to execute successfully"));
		if (forceTrace || !result.message) {
			console.trace();
		}
	}
}

class Tile {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.id = Date.now().toString(36) + 
                 Math.random().toString(36).substring(2, 6);

		this.Astar = {};
	}

	set g(v) {this.Astar.g = v;}
	set h(v) {this.Astar.h = v;}
	get g() {return (this.Astar.g ? this.Astar.g : "");}
	get h() {return (this.Astar.h ? this.Astar.h : "");}
	get f() {
		return (this.Astar.g && this.Astar.h ? this.Astar.g + this.Astar.h : "");
	}
	
	render(x, y) {
		if (window.debug) {
			return `${this.x},${this.y}<br>${this.id}`;
		} else {
			return `<span class='g'>${this.g}</span><span class='h'>${this.h}</span><span class='f'>${this.f}</span>`;
		}
	}
	get isWalkable() {
		return true;
	}
	get neighbors() {
		let neighborX = [-1,0,1,-1,0,1,-1,0,-1];
		let neighborY = [-1,-1,-1,0,0,0,1,1,1];
		let s2 = Math.sqrt(2);
		let costs = [s2,1,s2,1,0,1,s2,1,s2];
		let neighbors = [];

		for (let i =0; i < neighborX.length; i++) {
			let x = this.x + neighborX[i];
			let y = this.y + neighborY[i];
			if (x >= 0 && x < this.set.tileSet.width && y >= 0 && y < this.set.tileSet.height) {
				neighbors.push([
					this.set.tileSet.tiles[y][x],
					costs[i]
				]);
			}
		}
		
		return neighbors;
	}
}
class TileSet {
	constructor(tileContainer, width, height) {
		this.tileContainer = tileContainer;
		this.genTiles(width, height); // sets this.tiles to 2D array (row,item)
		this.sizeTiles();
		this.renderItter = 0;
	}
	get width() {
		return Math.max(...this.tiles.map((a) => a.length));
	}
	get height() {
		return Math.max(this.tiles.length);
	}

	genTiles(width, height) {
		width = width == undefined ? 4 : width;
		height = height == undefined ? 4 : height;
	
		let generated = []; // index y,x not x,y
		for (let i = 0; i < height; i++) {
			let row = [];
			for (let j = 0; j < width; j++) {
				row.push(new Tile(j, i));
			}
			generated.push(row);
		}
		this.tiles = generated;
	}

	get tileSize() {
		let root = document.querySelector(":root");
		let rootCompStyles = getComputedStyle(root);
		return Number(
			rootCompStyles.getPropertyValue('--tile-size').replace("px","")
		);
	}
	set tileSize(value) {
		if (typeof value != "number") {
			throw new TypeError("Value has to be a number (pixels)");
		}
		let root = document.querySelector(":root");
		root.style.setProperty('--tile-size', String(value)+"px");
	}
	sizeTiles() {
		let compStyles = getComputedStyle(this.tileContainer);
		let avWidth = Number(
			compStyles.width.replace("px","")
		);
		let avHeight = Number(
			compStyles.height.replace("px","")
		);
		
		let tileWidth = avWidth / this.width;
		let tileHeight = avHeight / this.height;

		let tileSize = tileWidth < tileHeight ? tileWidth : tileHeight;

		let root = document.querySelector(":root");
		root.style.setProperty('--tile-size', String(tileSize)+"px");
	}
	
	calcFittingTiles(options = {}) {
		/// options:
		/// {
		/// 	push: boolean
		/// 	resizeAfter: boolean
		/// }
		
		let compStyles = getComputedStyle(this.tileContainer);
		let avWidth = Number(
			compStyles.width.replace("px","")
		);
		let avHeight = Number(
			compStyles.height.replace("px","")
		);
		let root = document.querySelector(":root");
		let rootCompStyles = getComputedStyle(root);
		let tileSize = Number(
			rootCompStyles.getPropertyValue('--tile-size').replace("px","")
		);

		let widthTiles = Math.floor(avWidth/tileSize);
		let heightTiles = Math.floor(avHeight/tileSize);
		if (options.push == true) {
			this.genTiles(widthTiles, heightTiles);
			if (options.resizeAfter == true) {
				this.sizeTiles();
			}
		}
		return {width:widthTiles, height:heightTiles};
	}
	
	render(width, height) {
		console.groupEnd(`render ${this.renderItter-1}`);
		console.groupCollapsed(`render ${this.renderItter}`);
		this.renderItter++;
		width = width == undefined ? this.width : width;
		height = height == undefined ? this.height : height;
		console.log("Rendering TileSet, size " + String(width) + "," + String(height));
	
		this.tiles.forEach((tileRow,rowI) => {
			let rowEl = document.createElement("div");
			rowEl.classList.add("tileRow");
			
			tileRow.forEach((tile,colI) => {
				let el = document.createElement("div");
				el.id = "tile" + String(colI) + "," + String(rowI);
				el.classList.add("tile");
				el.innerHTML = tile.render(colI, rowI);
				
				rowEl.appendChild(el);
			});
			
			this.tileContainer.appendChild(rowEl);
		});
		console.groupEnd(`render ${this.renderItter-1}`);
	}
}
class Entity {
	constructor(set, type, x, y, visual, ai) {
		console.log("creating entity");
		this.set = set; // the set that contains this entity. used for checking neighboring tiles and such
		this.type = type;
		this.id = this.set.newId(type);
		this.x = x;
		this.y = y;
		this.visual = visual; // visual data, like entity name. depends on entity type
		this.ai = ai;

		this.set.entities.push(this);
	}
	toString() {
		return `Entity{${this.id}}`;
	}
	tick() {
		this.ai.assureFound(this, this.set.get("target0"));
		this.ai.move(this);
	}
	
	move(xOffset, yOffset) {
		console.assert(this.set instanceof EntitySet, `${this} is not linked to a valid instance of EntitySet`);
		console.assert(this.set.tileSet instanceof TileSet, `The EntitySet of ${this} is not linked to a valid instance of TileSet`);
		console.assert(typeof this.x == "number", `The x value for ${this} is not a valid number`);
		console.assert(typeof this.y == "number", `The y value for ${this} is not a valid number`);
		console.assert(typeof xOffset == "number", `The xOffset value for moving ${this} is not a valid number`);
		console.assert(typeof yOffset == "number", `The yOffset value for moving ${this} is not a valid number`);
		let newX = this.x + xOffset;
		let newY = this.y + yOffset;
		if (!(newX >= 0 && newX < this.set.tileSet.width && newY >= 0 && newY < this.set.tileSet.height)) {
			return {success: false, x: this.x, y: this.y, message: "out of bounds", 
					detailed: `Can not move from ${this.x}, ${this.y} to ${newX}, ${newY} because:
						${newX >= this.set.tileSet.width ? `x${newX} is more than width ${this.set.tileSet.width}\n` : ""}${newX < 0 ? `x${newX} is less than ${0}\n`: ""}${newY >= this.set.tileSet.height ? `y${newY} is more than height ${this.set.tileSet.height}\n` : ""}${newY < 0 ? `y${newY} is less than ${0}\n` : ""}`
				   };
		}
		if (this.set.tileSet.tiles[newY][newX].isWalkable) {
			this.x = newX;
			this.y = newY;
			this.set.render();
			return {success: true, x: this.x, y: this.y};
		} else {
			return {success: false, x: this.x, y: this.y, message: "unwalkable tile", detailed: `Tile ${newX},${newY} is unwalkable`};
		}
	}
	get tile() {
		return this.set.tileSet.tiles[this.y][this.x];
	}

	
}
class EntitySet {
	constructor(tileSet, playerData) {
		this.tileSet = tileSet;
		this.entities = [];
		this.typeCounter = {};
		if (playerData != undefined) {
			
			let playerAi = new AstarAi();
			let player = new Entity(this, "player", playerData.x, playerData.y, {name: playerData.name}, playerAi);
		}
		this.renderItter = 0;
		this.tickItter = 0;
	}
	tick() {
		console.groupEnd(`entity tick ${this.tickItter-1}`);
		console.group(`entity tick ${this.tickItter}`);
		this.tickItter++;
		let count = 0;
		let start = performance.now();
		this.entities.forEach((e) => {
	      if (e.tick) {e.tick();count++;}
	    });
		console.log(`ticked for ${count} entities during ${performance.now()-start} ms`);
		console.groupEnd(`entity tick ${this.tickItter-1}`);
	}
	render() {
		console.groupEnd(`entity render ${this.renderItter-1}`);
		console.groupCollapsed(`entity render ${this.renderItter}`);
		this.renderItter++;
		this.tileSet.tileContainer.querySelectorAll(".entity").forEach((el)=>{
			el.remove();
		});
		
		let tileRows = this.tileSet.tileContainer.children;
		this.entities.forEach(entity => {
			console.log(`rendering entity ${entity.id}`);
			let tiles = tileRows[entity.y];
			let tile = tiles.children[entity.x];
			let el = document.createElement("div");
			el.classList.add("entity");
			el.classList.add(entity.type);
			tile.appendChild(el);
		});
		console.groupEnd(`entity render ${this.renderItter-1}`);
	}
	update(id, changes) {
		let i = this.entities.findIndex(item=>item.id==id);
		if (i == -1) { return { success: false, message: `entity '${id}' was not found` }; }
		for (const [key, value] of Object.entries(changes)) {
			console.log(`${key}: ${value}`);
			if (key == "x" && (value < 0 || value >= this.tileSet.width)) {
				return { success: false, message: "Value for 'x' exceeds the width" };
			}
			if (key == "y" && (value < 0 || value >= this.tileSet.height)) {
				return { success: false, message: "Value for 'y' exceeds the height" };
			}
			this.entities[i][key] = value;
		}
		return { success: true, result: this.entities[i] };
	}
	get(id, values) {
		let i = this.entities.findIndex(item=>item.id==id);
		if (i == -1) {
			return {success: false, message: `entity '${id}' was not found`};
		}
		if (values == undefined) {
			return this.entities[i];
		}
		let requestedValues = {};
		values.forEach(key => {
			requestedValues[key] = this.entities[i][key];
		});
		return {success: true, result: requestedValues};
	}
	newId(type) {
		let num = (this.typeCounter[type] ? this.typeCounter[type] : 0);
		this.typeCounter[type] = num + 1;
		return type + String(num);
	}
	spawn(type, entity) {
		let newEntity = {
			type: type,
			id: this.newId(type),
			name: entity.name,
			x: entity.x == undefined ? 0 : entity.x,
			y: entity.y == undefined ? 0 : entity.y,
		};
		console.log("Spawning entity:", newEntity);
		this.entities.push(newEntity);
		this.render();
	}
}
class GameBoard {
	constructor(tileContainer, width, height) {
		this.tileSet = new TileSet(tileContainer, width, height);
		this.entitySet = new EntitySet(this.tileSet, {x:0,y:0});
		this.renderItter = 0;
	}
	get width() {
		return this.tileSet.width;
	}
	get height() {
		return this.tileSet.height;
	}
	
	render() {
		this.tileSet.tileContainer.innerHTML = "";
		this.tileSet.render();
		this.entitySet.render();
	}
}

// main loop
function main() {
	gameBoard.entitySet.tick();
	gameBoard.render();
}
// setup board
let tileContainer = document.getElementById("tileContainer");
let gameBoard = new GameBoard(tileContainer, 18, 8);
window.addEventListener("resize",() => {
	gameBoard.tileSet.sizeTiles();
});

gameBoard.tileSet.tileSize = 75;
gameBoard.tileSet.calcFittingTiles({push:true,resizeAfter:true});
gameBoard.render();

gameBoard.entitySet.spawn("target", {
	name:"target",
	x: Math.floor(Math.random() * (gameBoard.tileSet.width - 3)) + 3,
	y: Math.floor(Math.random() * (gameBoard.tileSet.height - 2)) + 2,
});

// run main loop
let a = () => {
	main();
	window.requestAnimationFrame(a);
};
// window.requestAnimationFrame(a)
let spf = 1000/10;
setInterval(() => {
	main();
},spf);