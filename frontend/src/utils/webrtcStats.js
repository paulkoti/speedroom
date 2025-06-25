// WebRTC Stats Collection Utility
export class WebRTCStatsCollector {
  constructor(socket) {
    this.socket = socket;
    this.isCollecting = false;
    this.interval = null;
    this.peerConnections = new Map();
  }

  addPeerConnection(userId, peerConnection) {
    this.peerConnections.set(userId, peerConnection);
  }

  removePeerConnection(userId) {
    this.peerConnections.delete(userId);
  }

  startCollection(intervalMs = 5000) {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.interval = setInterval(() => {
      this.collectAndSendStats();
    }, intervalMs);
  }

  stopCollection() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isCollecting = false;
  }

  async collectAndSendStats() {
    if (!this.socket || this.peerConnections.size === 0) return;

    try {
      const stats = {
        timestamp: Date.now(),
        connections: {},
        summary: {
          totalConnections: this.peerConnections.size,
          avgLatency: 0,
          totalPacketsLost: 0,
          totalPacketsSent: 0,
          avgBandwidth: 0
        }
      };

      let totalLatency = 0;
      let connectionsWithLatency = 0;
      let totalBandwidth = 0;

      for (const [userId, peerConnection] of this.peerConnections) {
        if (peerConnection.connectionState === 'connected') {
          const connectionStats = await this.getConnectionStats(peerConnection);
          stats.connections[userId] = connectionStats;

          // Aggregate for summary
          if (connectionStats.latency > 0) {
            totalLatency += connectionStats.latency;
            connectionsWithLatency++;
          }
          
          stats.summary.totalPacketsLost += connectionStats.packetsLost || 0;
          stats.summary.totalPacketsSent += connectionStats.packetsSent || 0;
          totalBandwidth += connectionStats.bandwidth || 0;
        }
      }

      // Calculate averages
      stats.summary.avgLatency = connectionsWithLatency > 0 
        ? Math.round(totalLatency / connectionsWithLatency) 
        : 0;
      stats.summary.avgBandwidth = Math.round(totalBandwidth / Math.max(1, this.peerConnections.size));

      // Send to server
      this.socket.emit('webrtc-stats', stats);
    } catch (error) {
      console.error('Error collecting WebRTC stats:', error);
    }
  }

  async getConnectionStats(peerConnection) {
    const stats = await peerConnection.getStats();
    const result = {
      connectionState: peerConnection.connectionState,
      iceConnectionState: peerConnection.iceConnectionState,
      latency: 0,
      packetsLost: 0,
      packetsSent: 0,
      bandwidth: 0,
      jitter: 0
    };

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.latency = report.currentRoundTripTime * 1000; // Convert to ms
      }
      
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        result.packetsLost = report.packetsLost || 0;
        result.jitter = report.jitter || 0;
      }
      
      if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        result.packetsSent = report.packetsSent || 0;
        if (report.bytesSent && report.timestamp) {
          // Estimate bandwidth (simplified)
          result.bandwidth = Math.round(report.bytesSent / 1024); // KB/s estimate
        }
      }
    });

    return result;
  }

  getQualityLevel(stats) {
    if (!stats || !stats.summary) return 'unknown';
    
    const { avgLatency, totalPacketsLost, totalPacketsSent } = stats.summary;
    const packetLossRate = totalPacketsSent > 0 ? (totalPacketsLost / totalPacketsSent) * 100 : 0;
    
    if (avgLatency < 50 && packetLossRate < 1) return 'excellent';
    if (avgLatency < 100 && packetLossRate < 3) return 'good';
    if (avgLatency < 200 && packetLossRate < 5) return 'fair';
    return 'poor';
  }
}