export type PathType = 'Dir' | 'SymlinkDir' | 'File' | 'SymlinkFile'

export type PathItem = {
  readonly path_type: PathType
  readonly name: string
  readonly mtime: number
  readonly size: number
  readonly etag?: string | null
  readonly allow_upload: boolean
  readonly allow_delete: boolean
  readonly readonly_descendant?: boolean
}

export type DufsPageKind = 'Index' | 'Edit' | 'View'

export type DufsData = {
  readonly href: string
  readonly uri_prefix: string
  readonly kind: DufsPageKind
  readonly paths: readonly PathItem[]
  readonly allow_upload: boolean
  readonly allow_delete: boolean
  readonly allow_search: boolean
  readonly allow_archive: boolean
  readonly auth: boolean
  readonly user: string
  readonly dir_exists: boolean
  readonly editable: boolean
}

export type SortField = 'name' | 'mtime' | 'size'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'list' | 'grid'

export type FileKind =
  'dir' | 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'text' | 'doc' | 'file'

export type CodeIconLang =
  | 'python'
  | 'go'
  | 'java'
  | 'ts'
  | 'js'
  | 'rust'
  | 'vue'
  | 'c'
  | 'cpp'
  | 'html'
  | 'css'
  | 'json'
  | 'yaml'
  | 'sh'
  | 'sql'
  | 'docker'
  | 'kotlin'
  | 'swift'
  | 'ruby'
  | 'php'
  | 'terraform'
  | 'opentofu'

export type UploadTaskState = 'queued' | 'uploading' | 'done' | 'error' | 'canceled'

export type UploadTask = {
  readonly id: number
  readonly file: File
  readonly name: string
  readonly url: string
  state: UploadTaskState
  loaded: number
  total: number
  offset: number
  speed: number
  eta: number
  errorText: string
}

export type DemoFileContent = {
  readonly url?: string
  readonly text?: string
  readonly file?: File
}

export type QrTarget = {
  readonly title: string
  readonly url: string
  readonly allowToken: boolean
}
