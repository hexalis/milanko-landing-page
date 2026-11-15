import * as THREE from 'three';

/** Mark an approximate area with an open contour; keep the weather's eye unobstructed.
 * Procedural phenomena are illustrative, not observations or meteorological models.
 */
export function createPlaceOverlay(point: { x: number; y: number; z: number }, kind: 'hurricane' | 'tropical' | 'dust' | 'snow' | 'fire') {
  const group = new THREE.Group();
  const normal = new THREE.Vector3(point.x, point.y, point.z);
  const radius = normal.length();
  group.position.copy(normal);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.normalize());
  const edge = .25;
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 96 }, (_, i) => {
      const angle = i / 96 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * edge, Math.sin(angle) * edge, Math.sqrt(radius * radius - edge * edge) - radius);
    }),
  ), new THREE.LineBasicMaterial({ color: '#a8dcf2', transparent: true, opacity: .35 }));
  group.add(ring);
  let mode = 0;
  if (kind === 'dust') mode = 1;
  if (kind === 'snow') mode = 2;
  if (kind === 'fire') mode = 3;
  const geometry = new THREE.PlaneGeometry(.46, .46, 24, 24);
  const vertices = geometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i);
    vertices.setZ(i, Math.sqrt(radius * radius - x * x - y * y) - radius);
  }
  geometry.computeVertexNormals();
  const cloud = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, mode: { value: mode }, strength: { value: kind === 'tropical' ? .58 : 1 }, hemisphere: { value: point.y < 0 ? -1 : 1 }, light: { value: new THREE.Vector3(-3, 3, 3).normalize() } },
    vertexShader: 'varying vec2 vUv; varying vec3 n; void main(){vUv=uv;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
      uniform float time; uniform float mode; uniform float strength; uniform float hemisphere;
      uniform vec3 light; varying vec2 vUv; varying vec3 n;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
      }
      float clouds(vec2 p){return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.07);}
      void main(){
        vec2 p=(vUv-.5)*2.; float r=length(p); float angle=atan(p.y,p.x);
        float shade=.5+.5*max(0.,dot(normalize(n),light));
        if(mode>.5 && mode<1.5){
          vec2 wind=vec2(p.x-time*.025,p.y);
          float grain=clouds(wind*vec2(7.,19.));
          float plume=exp(-p.y*p.y*5.)*(1.-smoothstep(.55,1.,r));
          float alpha=plume*smoothstep(.2,.7,grain)*.78;
          gl_FragColor=vec4(mix(vec3(.55,.36,.17),vec3(.96,.8,.53),grain)*shade,alpha);
          return;
        }
        if(mode>1.5 && mode<2.5){
          float mass=clouds((p+vec2(time*.012,0.))*vec2(8.,12.));
          float streak=pow(.5+.5*sin((p.y+p.x*.35+time*.025)*80.),10.);
          float edge=1.-smoothstep(.5,1.,r);
          float alpha=edge*(smoothstep(.26,.72,mass)*.72+streak*.12);
          gl_FragColor=vec4(mix(vec3(.6,.76,.9),vec3(1.),mass)*shade,alpha);
          return;
        }
        if(mode>2.5){
          float smoke=clouds((p-vec2(time*.018,time*.009))*vec2(6.,10.));
          smoke*=smoothstep(-.4,.25,p.y)*(1.-smoothstep(.4,1.,r));
          float front=1.-smoothstep(.025,.1,abs(p.y+.28+sin(p.x*12.)*.07));
          front*=smoothstep(.15,.8,noise(p*17.))*(1.-smoothstep(.4,.8,r));
          float alpha=min(.88,smoke*.65+front*.9);
          vec3 color=mix(vec3(.53,.57,.62)*shade,vec3(1.,.32,.055),front);
          gl_FragColor=vec4(color,alpha);
          return;
        }
        angle*=hemisphere;
        float turn=angle+r*5.-time*.08;
        vec2 flow=vec2(cos(turn),sin(turn))*r;
        float detail=clouds(flow*24.);
        float arms=.5+.5*sin(angle*2.-r*9.+detail*2.+time*.16);
        float eye=smoothstep(.055,.13,r);
        float density=smoothstep(.3,.78,detail*.6+arms*.4);
        float edge=1.-smoothstep(.55,1.,r);
        float alpha=eye*edge*(.08+.8*density)*strength;
        gl_FragColor=vec4(mix(vec3(.67,.79,.88),vec3(1.),density)*shade,alpha);
      }`,
  }));
  group.add(cloud);
  return {
    group,
    update(seconds: number, direction: THREE.Vector3) {
      cloud.material.uniforms.time!.value = seconds;
      cloud.material.uniforms.light!.value.copy(direction);
    },
  };
}
