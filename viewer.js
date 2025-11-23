// viewer.js

let renderer, scene, camera, controls;
let autoRotate = true;
const autoRotateSpeed = 0.005; // 회전 속도

async function init() {
  const canvas = document.getElementById('viewer');

  // 1. 렌더러 & 씬
  renderer = new Supersplat.Renderer({
    canvas: canvas,
    antialias: true,
  });

  scene = new Supersplat.Scene();

  // 2. 카메라
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new Supersplat.Camera(60, aspect, 0.1, 100.0);
  camera.position.set(0, 1.6, 4.0);

  // 3. 컨트롤 (Orbit 스타일) - 회전/줌만 허용
  controls = new Supersplat.OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.6;

  // 사용자가 직접 조작하면 잠시 자동 회전 멈추기
  controls.addEventListener?.("start", () => {
    autoRotate = false;
  });
  controls.addEventListener?.("end", () => {
    setTimeout(() => (autoRotate = true), 3000);
  });

  // 4. 3DGS 모델 로드 (파일명은 네 파일명으로 수정!)
  await loadSplatModel("test_2.splat");

  // 5. 리사이즈 대응
  window.addEventListener("resize", onWindowResize);
  onWindowResize();

  // 6. 렌더 루프 시작
  animate();
}

async function loadSplatModel(url) {
  const loader = new Supersplat.SplatLoader();
  const splat = await loader.load(url);

  scene.add(splat);

  // 모델 중심 계산 → 카메라 타겟 설정
  const bbox = new Supersplat.Box3().setFromObject(splat);
  const center = bbox.getCenter(new Supersplat.Vector3());

  controls.target.copy(center);
  camera.lookAt(center);
}

function onWindowResize() {
  const canvas = document.getElementById("viewer");
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  // 자동 회전 로직
  if (autoRotate) {
    const offset = new Supersplat.Vector3();
    offset.copy(camera.position).sub(controls.target);

    const theta = Math.atan2(offset.x, offset.z);
    const radius = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
    const phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

    const newTheta = theta + autoRotateSpeed;

    offset.x = radius * Math.sin(newTheta) * Math.sin(phi);
    offset.z = radius * Math.cos(newTheta) * Math.sin(phi);
    offset.y = radius * Math.cos(phi);

    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
  }

  controls.update();
  renderer.render(scene, camera);
}

// 초기화 실행
init().catch(console.error);
