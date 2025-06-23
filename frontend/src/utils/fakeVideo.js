export const createFakeVideoStream = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  let animationId;
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
  let colorIndex = 0;
  let frame = 0;
  
  const animate = () => {
    ctx.fillStyle = colors[colorIndex];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar círculo animado
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2 + Math.sin(frame * 0.05) * 100,
      canvas.height / 2 + Math.cos(frame * 0.03) * 80,
      30,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    // Texto indicativo
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VÍDEO FAKE', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Frame: ${frame}`, canvas.width / 2, canvas.height / 2 + 30);
    
    frame++;
    if (frame % 180 === 0) {
      colorIndex = (colorIndex + 1) % colors.length;
    }
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  const stream = canvas.captureStream(30);
  
  console.log('Stream fake criado com tracks:', stream.getTracks().map(t => t.kind));
  
  // Cleanup function
  stream.cleanup = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
  
  return stream;
};