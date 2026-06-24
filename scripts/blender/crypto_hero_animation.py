"""
Blender script: animated crypto hero scene for ExChange landing page.

Usage (Blender 3.x+):
  1. Open Blender → Scripting workspace
  2. Open this file or paste contents
  3. Run script (Alt+P)
  4. File → Export → glTF 2.0 (.glb)
     - Format: glTF Binary (.glb)
     - Include: Selected Objects
     - Animation: ✓
     - Export to: public/models/crypto_hero.glb

Then load in React Three Fiber with useGLTF('/models/crypto_hero.glb').
"""

import bpy
import math

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

def make_coin(name, location, scale, color):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64, radius=1, depth=0.18, location=location
    )
    coin = bpy.context.active_object
    coin.name = name
    coin.scale = (scale, scale, scale)

    mat = bpy.data.materials.new(name=f"{name}_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        bsdf.inputs['Metallic'].default_value = 0.9
        bsdf.inputs['Roughness'].default_value = 0.25
    coin.data.materials.append(mat)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=1, minor_radius=0.07,
        major_segments=64, minor_segments=12,
        location=location,
    )
    ring = bpy.context.active_object
    ring.name = f"{name}_ring"
    ring.scale = (scale, scale, scale)
    ring.rotation_euler = (math.pi / 2, 0, 0)
    ring.data.materials.append(mat)

    return coin, ring

# Main gold coin
main_coin, main_ring = make_coin('BTC_Coin', (0, 0, 0), 1.1, (0.96, 0.78, 0.27))

# Secondary coins
eth_coin, _ = make_coin('ETH_Coin', (1.4, 0.5, -0.8), 0.55, (0.66, 0.55, 0.98))
btc_small, _ = make_coin('BTC_Small', (-1.3, -0.4, -0.6), 0.45, (0.98, 0.57, 0.24))

# Lighting
bpy.ops.object.light_add(type='SPOT', location=(6, 8, 6))
spot = bpy.context.active_object
spot.data.energy = 800
spot.data.color = (0.77, 0.71, 0.99)

bpy.ops.object.light_add(type='POINT', location=(0, 0, 3))
point = bpy.context.active_object
point.data.energy = 400
point.data.color = (0.96, 0.78, 0.27)

# Animation: 120 frames, 24 fps (5 sec loop)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 120

for obj in [main_coin, eth_coin, btc_small]:
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path='rotation_euler', frame=1)
    obj.rotation_euler = (0.1, math.pi * 2, 0)
    obj.keyframe_insert(data_path='rotation_euler', frame=120)

# Float on main coin
main_coin.location = (0, 0, 0)
main_coin.keyframe_insert(data_path='location', frame=1)
main_coin.location = (0, 0.15, 0)
main_coin.keyframe_insert(data_path='location', frame=60)
main_coin.location = (0, -0.1, 0)
main_coin.keyframe_insert(data_path='location', frame=120)

print('Crypto hero scene created. Export as GLB from File → Export → glTF 2.0.')
