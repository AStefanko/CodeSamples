//Part of a project in Unity that took a series of user specifications to create a camera that fit all of these specifications
//Some methods that were used in the project itself are absent from this sample

using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using System.Linq;
using CinemaProCams;


public class SCV6 : MonoBehaviour {

	public enum Proxemics
	{
		Long=0, Medium=1, CloseUp=2,
	}

	public enum VerticalAngle
	{
		Low, High, EyeLevel,
	}

	public enum HorizontalAngle
	{
		Front, Back, Left, Right, FrontLeft, FrontRight, BackLeft, BackRight,
	}

	public enum Lens
	{
		Normal,
	}

	public enum CameraMovement
	{
		None, Tracking, Handheld,
	}

	//From user input
	public Proxemics proximity = Proxemics.Medium;
	public VerticalAngle Vertical = VerticalAngle.EyeLevel;
	public HorizontalAngle Horizontal = HorizontalAngle.Front;
	public Lens lens = Lens.Normal;
	public GameObject focus;
	public CameraMovement cameraMovement = CameraMovement.None;
	public GameObject[] Subjects;

	//Camera parts and camera 
	private Camera camera;
	private CameraBody cameraBody;

	GameObject shotCreator(List<GameObject> subjects) {

		Transform primaryTrans;
		if (focus != null) {
			primaryTrans = focus.GetComponent<Transform> ();
		} else {
			primaryTrans = subjects [0].GetComponent<Transform> ();
		}
		numSubjects = subjects.Count;


		//creating camera and setting defaults 
		GameObject proCam = CreateCamera (primaryTrans);
		Transform cameraTransform = proCam.GetComponent<Transform> ();
		cameraBody = proCam.GetComponent<CameraBody> ();
		camera = proCam.GetComponent<Camera> ();

		//returns different lens depending on proxemics 
		cameraBody.IndexOfLens = lensIndex ();


		//Default camera dimensions
		//And eye level and size of head
		BoundsFinder2 bf=new BoundsFinder2();
		bf.subjects = subjects;
		float[] dimensions = new float[4];
		dimensions = bf.getAllBounds (subjects);
		Bounds combineBounds = bf.justBounds ();
		float defaultHeight = dimensions[0];
		float defaultDepth = dimensions[1];
		float eyeLevel = dimensions[2];
		float headHeight = dimensions [3];


		//Determine distance between objects
		float maxDistanceBetweenObjects = distBetweenObjects (subjects, defaultDepth);

		//First get default camera distance from subjects
		//Then adjust for multiple subjects 
		float[] camera_position = cameraPosition (defaultHeight, eyeLevel, headHeight, 
			maxDistanceBetweenObjects, proximity);
		float cameraToActor = camera_position[0]+maxDistanceBetweenObjects;

		//Handling focus distance and f stop 
		cameraBody.FocusDistance = cameraToActor;

		//Adjust camera based on the vertical angle
		//Returns x rotation, y position adjustment, x or z adjustment
		float[] vertAngleAdjustments = verticalAngleProcessor (cameraToActor, Vertical, proximity);

		//adjusts camera based on horizontal angle
		//returns y rotation, x position adjustment, z position adjustment
		float[] horizAngleAdjustments = horizontalAngleProcessor (cameraToActor, cameraToActor, 
			maxDistanceBetweenObjects);

		//position values for position vector 
		float x_pos=horizAngleAdjustments[1];
		float y_pos = camera_position[1]+vertAngleAdjustments[1] + horizAngleAdjustments[3];
		float z_pos=horizAngleAdjustments[2];

		//rotation adjustments for rotation vector
		float rot_x=vertAngleAdjustments[0]; 
		float rot_y=horizAngleAdjustments[0];

		//Attaches movement scripts
		//based on user input 
		SimpleFollow3 follow;
		ShakeCam shake;
		if (cameraMovement!=CameraMovement.None) {
			proCam.AddComponent<SimpleFollow3>();
			follow = proCam.GetComponent ("SimpleFollow3") as SimpleFollow3;
			follow.targets = subjects;
			follow.y_adjust = y_pos;
			follow.z_adjust = z_pos;
			follow.x_adjust = x_pos;
			if (cameraMovement==CameraMovement.Handheld) {
				proCam.AddComponent<ShakeCam> ();
				shake = proCam.GetComponent ("ShakeCam") as ShakeCam;
				shake.positionShakeSpeed = 0.9f;
				shake.positionShakeRange = new Vector3 (0.2f, 0.2f, 0.3f);
				shake.rotationShakeRange = new Vector3 (5.0f, 5.0f, 5.0f);
				shake.rotationShakeSpeed = 0.9f;
			}
		}

		//sets camera rotation and position vectors 
		cameraTransform.eulerAngles = new Vector3 (rot_x, rot_y, 0);
		cameraTransform.position = new Vector3 (combineBounds.center.x + x_pos, y_pos,
			combineBounds.center.z + z_pos);

		cameraBody.IndexOfFStop = 5;

		return proCam;
	}
		

	//Returns default distance from the subjects in question
	//the subject height is the height of multiple subjects 
	float[] cameraPosition(float subjectHeight, float eyeLevel, float headheight, float maxDistance=0, 
		Proxemics proximity=Proxemics.Medium)
	{
		float distance = 0;
		float center = 0;
		if (proximity == Proxemics.CloseUp) {
			if (maxDistance > 0.3f) {
				throw new System.ArgumentOutOfRangeException ("The distance between subjects cannot be greater" +
				" than one foot for a close-up");
			}
			distance = (headheight*4) * 0.5f / Mathf.Tan (camera.fieldOfView * 0.5f * Mathf.Deg2Rad);
			center = eyeLevel;
		} else if (proximity == Proxemics.Long) {
			distance = subjectHeight * 0.5f / Mathf.Tan (camera.fieldOfView * 0.5f * Mathf.Deg2Rad);
			center = (subjectHeight/2);
		} else { 
			if (maxDistance > 1) {
				throw new System.ArgumentOutOfRangeException ("The distance between subjects cannot be greater" +
					" than three feet for a medium shot");
			}
			distance= (subjectHeight/2) *0.5f / Mathf.Tan (camera.fieldOfView * 0.5f * Mathf.Deg2Rad);
			center = eyeLevel-headheight;
		}
		float[] position = new float[2] {distance, center};
		return position;

	}

	//returns max distance between objects
	//used to determine if certain shot requests are valid
	float distBetweenObjects(List<GameObject> subjects, float depth) {
		float max_distance = 0;
		if (numSubjects == 1) {
			return 0;
		}
		foreach (GameObject go in subjects) {
			foreach (GameObject go2 in subjects) {
				if (go != go2) {
					float distance = Vector3.Distance (go.transform.position, go2.transform.position);
					if (distance > max_distance) {
						max_distance = distance;
					}
				}
			}
		}
		return max_distance;
	}


	//adjusts camera position and rotation based on the veritcal ange  
	//RETURNS: X rotation, Y adjustment, depth adjustment
	float[] verticalAngleProcessor(float distanceToActor, VerticalAngle vert=VerticalAngle.EyeLevel, 
		Proxemics proxim=Proxemics.Medium){

		float xRotation = 0;
		float yAdjustment = 0;
		float depthAdjustment = 0;
		if (vert == VerticalAngle.High) {
			xRotation = 40;
			yAdjustment = highAdjust(distanceToActor, xRotation);
		} else if (vert == VerticalAngle.Low) {
			switch (proxim) 
			{
			case Proxemics.CloseUp:
				xRotation = -40;
				yAdjustment = highAdjust (distanceToActor, xRotation);
				break;
			case Proxemics.Long:
				xRotation = -25;
				yAdjustment = highAdjust (distanceToActor, xRotation);
				break;
			default:
				xRotation = -40;
				yAdjustment = highAdjust (distanceToActor, xRotation);

				break;
			}
		} else {
			xRotation = 0;
			yAdjustment = 0;
		}
		yAdjustment = yAdjustment / numSubjects;
		float[] dims= new float[2] {xRotation, yAdjustment};
		return dims;
	}

	//Changes the index of the lens depending on the proxemics 
	int lensIndex(){
		int index = 4;
		if (proximity == Proxemics.CloseUp) {
			index = 8;
		} else if(proximity==Proxemics.Long){
			index = 2;
		}
		return index;
	}

	//If the vertical angle is high, adjusts the y position
	float highAdjust(float distance, float angle){
		float move = Mathf.Tan (angle * Mathf.Deg2Rad) * distance;
		return move;
	}
		
	
	// Update is called once per frame
	void Update () {
		if (focus != null) {
			cameraBody.FocusTransform = focus.transform;
			print (focus.name);
			cameraBody.IndexOfFStop = 2;
		} else {
			cameraBody.IndexOfFStop = 5;
		}
	
	}
}
