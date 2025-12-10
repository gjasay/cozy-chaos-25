// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.70
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';


export class PhysicsObjectState extends Schema {
    @type("number") public x!: number;
    @type("number") public y!: number;
    @type("number") public vx!: number;
    @type("number") public vy!: number;
    @type("number") public angle!: number;
}
