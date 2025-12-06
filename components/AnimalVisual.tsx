'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import { getCurrentAnimal, type Animal, type UserAnimal } from '@/lib/storage-supabase'

interface AnimalVisualProps {
  className?: string
}

export default function AnimalVisual({ className }: AnimalVisualProps) {
  const [animalData, setAnimalData] = useState<{ animal: Animal; progress: UserAnimal } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnimal = async () => {
    try {
      setLoading(true)
      const data = await getCurrentAnimal()
      setAnimalData(data)
    } catch (error) {
      console.error('Error loading animal:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnimal()

    // Listen for animal progress updates
    const handleUpdate = () => {
      loadAnimal()
    }
    window.addEventListener('animalProgressUpdate', handleUpdate)
    
    return () => {
      window.removeEventListener('animalProgressUpdate', handleUpdate)
    }
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <p className="text-gray-600">Loading animal...</p>
        </div>
      </Card>
    )
  }

  if (!animalData) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <p className="text-gray-600">No animal available</p>
        </div>
      </Card>
    )
  }

  const { animal, progress } = animalData
  const filledNodes = progress.current_node_index
  const totalNodes = animal.total_nodes
  const progressPercent = Math.round((filledNodes / totalNodes) * 100)
  const isCompleted = progress.is_completed

  // Parse nodes (they're stored as JSON)
  const nodes = Array.isArray(animal.nodes) 
    ? animal.nodes 
    : typeof animal.nodes === 'string' 
      ? JSON.parse(animal.nodes) 
      : []

  // Animal emojis for better visual recognition
  const animalEmojis: Record<string, string> = {
    'Bird': '🐦',
    'Fox': '🦊',
    'Deer': '🦌',
    'Whale': '🐋',
  }

  const emoji = animalEmojis[animal.name] || '🎨'

  // Create smooth SVG path using quadratic curves for better animal shapes
  const createSmoothPath = (nodeList: Array<{ x: number; y: number }>, closed: boolean = true) => {
    if (nodeList.length < 2) return ''
    
    let path = `M ${nodeList[0].x} ${nodeList[0].y}`
    
    // Use smooth curves (quadratic bezier) for more organic shapes
    for (let i = 1; i < nodeList.length; i++) {
      const prev = nodeList[i - 1]
      const curr = nodeList[i]
      
      // Calculate control point for smooth curve
      if (i === 1) {
        // First curve - use midpoint
        const midX = (prev.x + curr.x) / 2
        const midY = (prev.y + curr.y) / 2
        path += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`
      } else {
        // Subsequent curves - use smooth transitions
        const next = nodeList[(i + 1) % nodeList.length]
        const cpX = curr.x - (next.x - prev.x) * 0.1
        const cpY = curr.y - (next.y - prev.y) * 0.1
        path += ` T ${curr.x} ${curr.y}`
      }
    }
    
    if (closed && nodeList.length > 2) {
      path += ' Z'
    }
    
    return path
  }

  const allNodesPath = createSmoothPath(nodes)
  const filledNodesPath = filledNodes > 2 ? createSmoothPath(nodes.slice(0, filledNodes)) : ''

  return (
    <Card className={className}>
      <div className="relative">
        <div className="mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-3 tracking-tight">
            <span className="text-4xl sm:text-5xl">{emoji}</span>
            <span>{animal.name}</span>
            {isCompleted && <span className="text-3xl sm:text-4xl">🏆</span>}
          </h3>
          {isCompleted ? (
            <p className="text-green-700 font-bold text-lg sm:text-xl">Completed! 🎉</p>
          ) : (
            <p className="text-gray-600 text-base sm:text-lg font-medium">
              Progress: <span className="font-bold text-primary">{filledNodes}</span> / <span className="font-bold">{totalNodes}</span> nodes ({progressPercent}%)
            </p>
          )}
        </div>

        {/* SVG Canvas */}
        <div className="w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 lg:p-10 border-2 border-gray-200/60 shadow-soft">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto max-h-[500px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* SVG Definitions */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
              </linearGradient>
              
              <linearGradient id="outlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6b7280" stopOpacity="0.7" />
              </linearGradient>
              
              <radialGradient id="nodeGlow">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </radialGradient>
            </defs>

            {/* Draw complete outline (light, semi-transparent) */}
            {allNodesPath && (
              <path
                d={allNodesPath}
                fill="none"
                stroke="url(#outlineGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                filter="url(#glow)"
              />
            )}

            {/* Draw filled portion with gradient and depth */}
            {filledNodesPath && filledNodes > 2 && (
              <>
                {/* Shadow layer */}
                <path
                  d={filledNodesPath}
                  fill="#1e40af"
                  opacity="0.2"
                  transform="translate(1, 1)"
                />
                {/* Main filled shape */}
                <path
                  d={filledNodesPath}
                  fill="url(#blueGradient)"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.95"
                  filter="url(#glow)"
                />
                {/* Inner highlight for depth */}
                <path
                  d={filledNodesPath}
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.7"
                />
              </>
            )}

            {/* Draw filled nodes (blue circles with enhanced glow) */}
            {nodes.slice(0, filledNodes).map((node: { x: number; y: number }, index: number) => (
              <g key={`filled-${index}`}>
                {/* Outer glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="6"
                  fill="url(#nodeGlow)"
                  opacity="0.4"
                />
                {/* Middle glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="5"
                  fill="#3b82f6"
                  opacity="0.3"
                />
                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="#1e40af"
                  strokeWidth="1.2"
                  className="drop-shadow-lg"
                />
                {/* Inner highlight */}
                <circle
                  cx={node.x - 1.2}
                  cy={node.y - 1.2}
                  r="1.8"
                  fill="#93c5fd"
                  opacity="0.9"
                />
              </g>
            ))}

            {/* Draw empty nodes (outline circles with better styling) */}
            {nodes.slice(filledNodes).map((node: { x: number; y: number }, index: number) => (
              <g key={`empty-${index}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4.5"
                  fill="white"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeDasharray="3,2"
                  opacity="0.8"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="2.5"
                  fill="#e5e7eb"
                  opacity="0.6"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Progress Bar */}
        {!isCompleted && (
          <div className="mt-6 sm:mt-8">
            <div className="w-full bg-gray-200/60 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

