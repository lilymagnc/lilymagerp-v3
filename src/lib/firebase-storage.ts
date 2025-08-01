import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { storage } from './firebase';

export class FirebaseStorageService {
  private static getAlbumPath(albumId: string) {
    return `sample-albums/${albumId}`;
  }

  private static getPhotoPath(albumId: string, photoId: string, type: 'original' | 'thumbnail' | 'preview' = 'original') {
    const basePath = this.getAlbumPath(albumId);
    switch (type) {
      case 'thumbnail':
        return `${basePath}/thumbnails/${photoId}`;
      case 'preview':
        return `${basePath}/previews/${photoId}`;
      default:
        return `${basePath}/originals/${photoId}`;
    }
  }

  static async uploadPhoto(
    albumId: string, 
    photoId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    originalUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
  }> {
    try {
      // 원본 이미지 업로드
      const originalRef = ref(storage, this.getPhotoPath(albumId, photoId, 'original'));
      const originalSnapshot = await uploadBytes(originalRef, file);
      const originalUrl = await getDownloadURL(originalSnapshot.ref);

      // TODO: 썸네일과 미리보기는 Cloud Functions에서 자동 생성하도록 구현
      // 현재는 원본 URL을 임시로 사용
      const thumbnailUrl = originalUrl;
      const previewUrl = originalUrl;

      return {
        originalUrl,
        thumbnailUrl,
        previewUrl
      };
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error('사진 업로드에 실패했습니다.');
    }
  }

  static async deletePhoto(albumId: string, photoId: string): Promise<void> {
    try {
      // 원본, 썸네일, 미리보기 모두 삭제
      const originalRef = ref(storage, this.getPhotoPath(albumId, photoId, 'original'));
      const thumbnailRef = ref(storage, this.getPhotoPath(albumId, photoId, 'thumbnail'));
      const previewRef = ref(storage, this.getPhotoPath(albumId, photoId, 'preview'));

      await Promise.allSettled([
        deleteObject(originalRef),
        deleteObject(thumbnailRef),
        deleteObject(previewRef)
      ]);
    } catch (error) {
      console.error('Photo deletion failed:', error);
      throw new Error('사진 삭제에 실패했습니다.');
    }
  }

  static async deleteAlbum(albumId: string): Promise<void> {
    try {
      const albumRef = ref(storage, this.getAlbumPath(albumId));
      const listResult = await listAll(albumRef);
      
      // 모든 하위 파일 삭제
      const deletePromises = listResult.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
      
      // 하위 폴더들도 삭제
      for (const folder of listResult.prefixes) {
        const folderList = await listAll(folder);
        const folderDeletePromises = folderList.items.map(item => deleteObject(item));
        await Promise.all(folderDeletePromises);
      }
    } catch (error) {
      console.error('Album deletion failed:', error);
      throw new Error('앨범 삭제에 실패했습니다.');
    }
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    // 파일 타입 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return {
        isValid: false,
        error: 'JPEG, PNG, WebP 파일만 업로드 가능합니다.'
      };
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: '파일 크기는 10MB 이하여야 합니다.'
      };
    }

    return { isValid: true };
  }
}