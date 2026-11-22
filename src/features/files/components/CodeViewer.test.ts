import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import CodeViewer from './CodeViewer.vue'

describe('CodeViewer', () => {
  it('renders language badge, line numbers, and syntax tokens without v-html', () => {
    const source = ['[server]', 'port = 5000', 'enabled = true'].join('\n')
    const view = render(CodeViewer, {
      props: {
        code: source,
        filename: 'dufs.toml',
      },
    })

    expect(screen.getByLabelText('代码语言')).toHaveTextContent('TOML')
    expect(view.container.querySelectorAll('.code-line')).toHaveLength(3)
    expect(view.container.querySelector('.tok-section')).toHaveTextContent('[server]')
    expect(view.container.querySelector('.tok-key')).toHaveTextContent('port')
    expect(view.container.querySelector('.tok-number')).toHaveTextContent('5000')
    expect(view.container.querySelector('.tok-boolean')).toHaveTextContent('true')
  })

  it('switches language highlighting dynamically when props change', async () => {
    const view = render(CodeViewer, {
      props: {
        code: 'package main',
        filename: 'main.go',
      },
    })

    expect(screen.getByLabelText('代码语言')).toHaveTextContent('GO')
    expect(view.container.querySelector('.tok-keyword')).toHaveTextContent('package')

    await view.rerender({
      code: 'services:\n  app: true',
      filename: 'compose.yaml',
    })

    expect(screen.getByLabelText('代码语言')).toHaveTextContent('YAML')
    expect(view.container.querySelector('.tok-key')).toHaveTextContent('services')
    expect(view.container.querySelector('.tok-boolean')).toHaveTextContent('true')
  })
})
