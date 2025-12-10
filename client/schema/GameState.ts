// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.70
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { CircleState } from './CircleState'
import { BoxState } from './BoxState'

export class GameState extends Schema {
    @type([ CircleState ]) public balls: ArraySchema<CircleState> = new ArraySchema<CircleState>();
    @type([ BoxState ]) public boxes: ArraySchema<BoxState> = new ArraySchema<BoxState>();
}
