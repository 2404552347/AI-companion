'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[200px] items-center justify-center p-6">
          <Card className="border-destructive/30 bg-destructive/5 max-w-md">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive/70" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">出了点问题</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {this.state.error?.message || '未知错误'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
